const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("PEOPLE reusable event controller", function () {
  async function deployCollection(factory, controller, name, symbol, uri) {
    const tx = await factory.createEventPOAP(name, symbol, uri, controller.target);
    const receipt = await tx.wait();
    const log = receipt.logs.find((l) => l.fragment && l.fragment.name === "EventPOAPCreated");
    const nft = await ethers.getContractAt("EventPOAP", log.args.poap);
    return nft;
  }

  async function fixture() {
    const [owner, admin, user, otherUser] = await ethers.getSigners();

    const POAPDapp = await ethers.getContractFactory("POAPDapp");
    const poapDapp = await POAPDapp.deploy();

    const Factory = await ethers.getContractFactory("POAPFactory");
    const factory = await Factory.deploy();

    const nftA = await deployCollection(
      factory,
      poapDapp,
      "BOT Chain Pilot Attendance",
      "BOTA",
      "ipfs://event-a/metadata.json"
    );

    const codeA = "BOHR-EVENT-A";
    const hashA = ethers.keccak256(ethers.toUtf8Bytes(codeA));
    const deadlineA = (await time.latest()) + 7 * 24 * 60 * 60;
    await poapDapp.activateEvent(nftA.target, hashA, deadlineA);

    return { owner, admin, user, otherUser, poapDapp, factory, nftA, codeA, hashA, deadlineA };
  }

  describe("event activation", function () {
    it("atomically sets NFT, claim hash and deadline", async function () {
      const { poapDapp, nftA, hashA, deadlineA } = await loadFixture(fixture);
      expect(await poapDapp.poapNftContract()).to.equal(nftA.target);
      expect(await poapDapp.codeHash()).to.equal(hashA);
      expect(await poapDapp.claimDeadline()).to.equal(deadlineA);
    });

    it("prevents non-admin activation", async function () {
      const { poapDapp, factory, user } = await loadFixture(fixture);
      const nftB = await deployCollection(factory, poapDapp, "Event B", "BOTB", "ipfs://event-b");
      const hashB = ethers.keccak256(ethers.toUtf8Bytes("B"));
      await expect(
        poapDapp.connect(user).activateEvent(nftB.target, hashB, (await time.latest()) + 1000)
      ).to.be.revertedWithCustomError(poapDapp, "NotAuthorized");
    });

    it("clears claim settings when only the NFT address is changed", async function () {
      const { poapDapp, factory } = await loadFixture(fixture);
      const nftB = await deployCollection(factory, poapDapp, "Event B", "BOTB", "ipfs://event-b");
      await poapDapp.updateNFTContract(nftB.target);
      expect(await poapDapp.poapNftContract()).to.equal(nftB.target);
      expect(await poapDapp.codeHash()).to.equal(ethers.ZeroHash);
      expect(await poapDapp.claimDeadline()).to.equal(0);
    });

    it("clears active claim settings when minting is stopped", async function () {
      const { poapDapp } = await loadFixture(fixture);
      await poapDapp.stopMinting();
      expect(await poapDapp.poapNftContract()).to.equal(ethers.ZeroAddress);
      expect(await poapDapp.codeHash()).to.equal(ethers.ZeroHash);
      expect(await poapDapp.claimDeadline()).to.equal(0);
    });
  });

  describe("event-scoped duplicate protection", function () {
    it("rejects a duplicate claim for the same event", async function () {
      const { poapDapp, nftA, user, codeA } = await loadFixture(fixture);
      await poapDapp.connect(user).mint(codeA);
      expect(await poapDapp.hasClaimed(nftA.target, user.address)).to.equal(true);
      await expect(poapDapp.connect(user).mint(codeA)).to.be.revertedWithCustomError(poapDapp, "AlreadyMinted");
    });

    it("allows the same wallet to claim a newly activated event", async function () {
      const { poapDapp, factory, nftA, user, codeA } = await loadFixture(fixture);
      await poapDapp.connect(user).mint(codeA);

      const nftB = await deployCollection(factory, poapDapp, "Second Event", "BOTB", "ipfs://event-b");
      const codeB = "BOHR-EVENT-B";
      const hashB = ethers.keccak256(ethers.toUtf8Bytes(codeB));
      const deadlineB = (await time.latest()) + 8 * 24 * 60 * 60;
      await poapDapp.activateEvent(nftB.target, hashB, deadlineB);

      await expect(poapDapp.connect(user).mint(codeB))
        .to.emit(poapDapp, "AttendanceClaimed")
        .withArgs(user.address, nftB.target, 0);

      expect(await poapDapp.hasClaimed(nftA.target, user.address)).to.equal(true);
      expect(await poapDapp.hasClaimed(nftB.target, user.address)).to.equal(true);
      expect(await nftA.balanceOf(user.address)).to.equal(1);
      expect(await nftB.balanceOf(user.address)).to.equal(1);
    });

    it("changing the code for the active NFT does not reset claimed state", async function () {
      const { poapDapp, nftA, user, codeA } = await loadFixture(fixture);
      await poapDapp.connect(user).mint(codeA);

      const newCode = "ROTATED-CODE";
      const newHash = ethers.keccak256(ethers.toUtf8Bytes(newCode));
      await poapDapp.configureClaim(newHash, (await time.latest()) + 10000);

      expect(await poapDapp.hasClaimed(nftA.target, user.address)).to.equal(true);
      await expect(poapDapp.connect(user).mint(newCode)).to.be.revertedWithCustomError(poapDapp, "AlreadyMinted");
    });
  });

  describe("claim validation", function () {
    it("mints with the active event code", async function () {
      const { poapDapp, nftA, user, codeA } = await loadFixture(fixture);
      await poapDapp.connect(user).mint(codeA);
      expect(await nftA.ownerOf(0)).to.equal(user.address);
    });

    it("rejects a wrong code", async function () {
      const { poapDapp, user } = await loadFixture(fixture);
      await expect(poapDapp.connect(user).mint("WRONG")).to.be.revertedWithCustomError(poapDapp, "InvalidCode");
    });

    it("rejects expired claims", async function () {
      const { poapDapp, user, codeA, deadlineA } = await loadFixture(fixture);
      await time.increaseTo(deadlineA + 1);
      await expect(poapDapp.connect(user).mint(codeA)).to.be.revertedWithCustomError(poapDapp, "MintingExpired");
    });

    it("requires an active event before configuring a code", async function () {
      const { poapDapp } = await loadFixture(fixture);
      await poapDapp.stopMinting();
      const newHash = ethers.keccak256(ethers.toUtf8Bytes("NEW"));
      await expect(poapDapp.configureClaim(newHash, (await time.latest()) + 1000))
        .to.be.revertedWithCustomError(poapDapp, "MintingDisabled");
    });
  });

  describe("administration", function () {
    it("allows only owner to manage admins", async function () {
      const { poapDapp, admin, user } = await loadFixture(fixture);
      await poapDapp.addAdmin(admin.address);
      expect(await poapDapp.admins(admin.address)).to.equal(true);
      await expect(poapDapp.connect(user).addAdmin(user.address)).to.be.reverted;
      await poapDapp.removeAdmin(admin.address);
      expect(await poapDapp.admins(admin.address)).to.equal(false);
    });
  });
});
