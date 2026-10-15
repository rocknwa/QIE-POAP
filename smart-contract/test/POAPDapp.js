const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("PEOPLE Bohr pilot contracts", function () {
  async function fixture() {
    const [owner, admin, user, otherUser] = await ethers.getSigners();

    const POAPDapp = await ethers.getContractFactory("POAPDapp");
    const poapDapp = await POAPDapp.deploy();

    const Factory = await ethers.getContractFactory("POAPFactory");
    const factory = await Factory.deploy();

    const metadataURI = "ipfs://bafy-event-metadata/metadata.json";
    const tx = await factory.createEventPOAP(
      "BOT Chain Pilot Attendance",
      "BOTPOAP",
      metadataURI,
      poapDapp.target
    );
    const receipt = await tx.wait();
    const log = receipt.logs.find((l) => l.fragment && l.fragment.name === "EventPOAPCreated");
    const nftAddress = log.args.poap;
    const poapNFT = await ethers.getContractAt("EventPOAP", nftAddress);

    await poapDapp.updateNFTContract(nftAddress);

    const code = "BOHR-PILOT-2026";
    const codeHash = ethers.keccak256(ethers.toUtf8Bytes(code));
    const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
    await poapDapp.configureClaim(codeHash, deadline);

    return { owner, admin, user, otherUser, poapDapp, factory, poapNFT, code, codeHash, deadline, metadataURI };
  }

  describe("Factory and event NFT", function () {
    it("creates an event-specific collection with the controller as minter", async function () {
      const { poapNFT, poapDapp, metadataURI } = await loadFixture(fixture);
      expect(await poapNFT.name()).to.equal("BOT Chain Pilot Attendance");
      expect(await poapNFT.symbol()).to.equal("BOTPOAP");
      expect(await poapNFT.minter()).to.equal(poapDapp.target);
      expect(await poapNFT.nextTokenId()).to.equal(0);

      const { user, code } = await loadFixture(fixture);
      await poapDapp.connect(user).mint(code);
      expect(await poapNFT.tokenURI(0)).to.equal(metadataURI);
    });

    it("restricts NFT creation to owner/approved admins", async function () {
      const { factory, poapDapp, admin, user } = await loadFixture(fixture);

      await expect(
        factory.connect(user).createEventPOAP("Unauthorized", "NOPE", "ipfs://x", poapDapp.target)
      ).to.be.revertedWithCustomError(factory, "NotAuthorized");

      await expect(factory.addAdmin(admin.address))
        .to.emit(factory, "AdminUpdated")
        .withArgs(admin.address, true);
      expect(await factory.admins(admin.address)).to.equal(true);

      await expect(
        factory.connect(admin).createEventPOAP("Admin Event", "ADMIN", "ipfs://admin", poapDapp.target)
      ).to.emit(factory, "EventPOAPCreated");

      await expect(factory.connect(user).addAdmin(user.address)).to.be.reverted;
      await factory.removeAdmin(admin.address);
      expect(await factory.admins(admin.address)).to.equal(false);
      await expect(
        factory.connect(admin).createEventPOAP("Removed Admin", "NOPE", "ipfs://x", poapDapp.target)
      ).to.be.revertedWithCustomError(factory, "NotAuthorized");
    });

    it("rejects zero-address factory admins", async function () {
      const { factory } = await loadFixture(fixture);
      await expect(factory.addAdmin(ethers.ZeroAddress)).to.be.revertedWithCustomError(factory, "ZeroAddress");
    });

    it("rejects invalid factory inputs", async function () {
      const { factory, poapDapp } = await loadFixture(fixture);
      await expect(factory.createEventPOAP("", "BOT", "ipfs://x", poapDapp.target)).to.be.revertedWithCustomError(factory, "EmptyName");
      await expect(factory.createEventPOAP("BOT", "", "ipfs://x", poapDapp.target)).to.be.revertedWithCustomError(factory, "EmptySymbol");
      await expect(factory.createEventPOAP("BOT", "BOT", "", poapDapp.target)).to.be.revertedWithCustomError(factory, "EmptyMetadataURI");
      await expect(factory.createEventPOAP("BOT", "BOT", "ipfs://x", ethers.ZeroAddress)).to.be.revertedWithCustomError(factory, "ZeroMinter");
    });

    it("only allows the configured controller to mint", async function () {
      const { poapNFT, user } = await loadFixture(fixture);
      await expect(poapNFT.connect(user).mint(user.address)).to.be.revertedWithCustomError(poapNFT, "NotMinter");
    });

    it("is soulbound and disables approvals", async function () {
      const { poapDapp, poapNFT, user, otherUser, code } = await loadFixture(fixture);
      await poapDapp.connect(user).mint(code);

      await expect(poapNFT.connect(user).transferFrom(user.address, otherUser.address, 0)).to.be.revertedWithCustomError(poapNFT, "Soulbound");
      await expect(poapNFT.connect(user).approve(otherUser.address, 0)).to.be.revertedWithCustomError(poapNFT, "ApprovalsDisabled");
      await expect(poapNFT.connect(user).setApprovalForAll(otherUser.address, true)).to.be.revertedWithCustomError(poapNFT, "ApprovalsDisabled");
    });
  });

  describe("Claim configuration and administration", function () {
    it("stores only the code hash and explicit deadline", async function () {
      const { poapDapp, codeHash, deadline } = await loadFixture(fixture);
      expect(await poapDapp.codeHash()).to.equal(codeHash);
      expect(await poapDapp.claimDeadline()).to.equal(deadline);
    });

    it("allows owner to manage admins", async function () {
      const { poapDapp, admin } = await loadFixture(fixture);
      await expect(poapDapp.addAdmin(admin.address)).to.emit(poapDapp, "AdminUpdated").withArgs(admin.address, true);
      expect(await poapDapp.admins(admin.address)).to.equal(true);
      await poapDapp.removeAdmin(admin.address);
      expect(await poapDapp.admins(admin.address)).to.equal(false);
    });

    it("prevents non-admin configuration", async function () {
      const { poapDapp, user, codeHash } = await loadFixture(fixture);
      await expect(poapDapp.connect(user).configureClaim(codeHash, (await time.latest()) + 1000)).to.be.revertedWithCustomError(poapDapp, "NotAuthorized");
    });

    it("rejects invalid deadlines, hashes, and NFT addresses", async function () {
      const { poapDapp, codeHash } = await loadFixture(fixture);
      await expect(poapDapp.configureClaim(ethers.ZeroHash, (await time.latest()) + 1000)).to.be.revertedWithCustomError(poapDapp, "InvalidCodeHash");
      await expect(poapDapp.configureClaim(codeHash, await time.latest())).to.be.revertedWithCustomError(poapDapp, "InvalidDeadline");
      await expect(poapDapp.updateNFTContract(ethers.ZeroAddress)).to.be.revertedWithCustomError(poapDapp, "InvalidNFTContract");
    });
  });

  describe("Claims", function () {
    it("mints successfully with the valid event code", async function () {
      const { poapDapp, poapNFT, user, code } = await loadFixture(fixture);
      await expect(poapDapp.connect(user).mint(code)).to.emit(poapDapp, "AttendanceClaimed");
      expect(await poapNFT.balanceOf(user.address)).to.equal(1);
      expect(await poapNFT.ownerOf(0)).to.equal(user.address);
      expect(await poapDapp.hasClaimed(user.address)).to.equal(true);
    });

    it("rejects an unauthorized/wrong claim code", async function () {
      const { poapDapp, user } = await loadFixture(fixture);
      await expect(poapDapp.connect(user).mint("NOT-THE-EVENT-CODE")).to.be.revertedWithCustomError(poapDapp, "InvalidCode");
    });

    it("rejects duplicate claims using controller state", async function () {
      const { poapDapp, user, code } = await loadFixture(fixture);
      await poapDapp.connect(user).mint(code);
      await expect(poapDapp.connect(user).mint(code)).to.be.revertedWithCustomError(poapDapp, "AlreadyMinted");
    });

    it("rejects expired claims", async function () {
      const { poapDapp, user, code, deadline } = await loadFixture(fixture);
      await time.increaseTo(deadline + 1);
      await expect(poapDapp.connect(user).mint(code)).to.be.revertedWithCustomError(poapDapp, "MintingExpired");
    });

    it("rejects claims when minting is stopped", async function () {
      const { poapDapp, user, code } = await loadFixture(fixture);
      await poapDapp.stopMinting();
      await expect(poapDapp.connect(user).mint(code)).to.be.revertedWithCustomError(poapDapp, "MintingDisabled");
    });
  });
});
