const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("POAPDapp", function () {
  async function deployPOAPFixture() {
  const [owner, admin, user, otherUser] = await ethers.getSigners();
  
  // Deploy POAPNFT contract
  const POAPNFT = await ethers.getContractFactory("POAPNFT");
  const poapNFT = await POAPNFT.deploy();
  
  // Deploy POAPDapp contract
  const POAPDapp = await ethers.getContractFactory("POAPDapp");
  const poapDapp = await POAPDapp.deploy();
  
  // Transfer ownership of POAPNFT to POAPDapp
  await poapNFT.transferOwnership(poapDapp.target);
  
  // Set initial valid code
  const initialCode = "TEST123";
  await poapDapp.updateCode(initialCode);
  
  // Set NFT contract address
  await poapDapp.updateNFTContract(poapNFT.target);
  
  return { poapDapp, poapNFT, initialCode, owner, admin, user, otherUser };
}
  describe("Deployment", function () {
    it("Should set the owner correctly", async function () {
      const { poapDapp, owner } = await loadFixture(deployPOAPFixture);
      expect(await poapDapp.owner()).to.equal(owner.address);
    });

    it("Should set deployer as admin", async function () {
      const { poapDapp, owner, initialCode } = await loadFixture(deployPOAPFixture);
      expect(await poapDapp.connect(owner).getCode()).to.equal(initialCode);
    });
  });

  describe("Admin Management", function () {
    it("Should allow owner to add admin", async function () {
      const { poapDapp, admin, initialCode } = await loadFixture(deployPOAPFixture);
      await poapDapp.addAdmin(admin.address);
      expect(await poapDapp.connect(admin).getCode()).to.equal(initialCode);
    });

    it("Should allow owner to remove admin", async function () {
      const { poapDapp, admin } = await loadFixture(deployPOAPFixture);
      await poapDapp.addAdmin(admin.address);
      await poapDapp.removeAdmin(admin.address);
      await expect(poapDapp.connect(admin).getCode()).to.be.revertedWithCustomError(
        poapDapp,
        "NotAuthorized"
      );
    });

    it("Should prevent non-owners from adding admins", async function () {
      const { poapDapp, user } = await loadFixture(deployPOAPFixture);
      await expect(poapDapp.connect(user).addAdmin(user.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("Code Management", function () {
    it("Should allow admin to update code", async function () {
      const { poapDapp, owner } = await loadFixture(deployPOAPFixture);
      const newCode = "NEWCODE123";
      await expect(poapDapp.connect(owner).updateCode(newCode))
        .to.emit(poapDapp, "CodeUpdated")
        .withArgs(newCode);
      expect(await poapDapp.connect(owner).getCode()).to.equal(newCode);
    });

    it("Should prevent non-admins from updating code", async function () {
      const { poapDapp, user } = await loadFixture(deployPOAPFixture);
      await expect(poapDapp.connect(user).updateCode("NEWCODE")).to.be.revertedWithCustomError(
        poapDapp,
        "NotAuthorized"
      );
    });
  });

  describe("NFT Contract Management", function () {
    it("Should allow admin to update NFT contract", async function () {
      const { poapDapp, owner } = await loadFixture(deployPOAPFixture);
      const newNFT = await (await ethers.getContractFactory("POAPNFT")).deploy();
      await expect(poapDapp.connect(owner).updateNFTContract(newNFT.target))
        .to.emit(poapDapp, "NFTContractUpdated")
        .withArgs(newNFT.target);
      expect(await poapDapp.poapNftContract()).to.equal(newNFT.target);
    });

    it("Should allow admin to stop minting", async function () {
      const { poapDapp, owner } = await loadFixture(deployPOAPFixture);
      await expect(poapDapp.connect(owner).stopMinting())
        .to.emit(poapDapp, "MintingStopped");
      expect(await poapDapp.poapNftContract()).to.equal(ethers.ZeroAddress);
    });

    it("Should prevent non-admins from updating NFT contract", async function () {
      const { poapDapp, user } = await loadFixture(deployPOAPFixture);
      const newNFT = await (await ethers.getContractFactory("POAPNFT")).deploy();
      await expect(poapDapp.connect(user).updateNFTContract(newNFT.target)).to.be.revertedWithCustomError(
        poapDapp,
        "NotAuthorized"
      );
    });
  });

  describe("Minting", function () {
    it("Should allow minting with valid code", async function () {
      const { poapDapp, poapNFT, initialCode, user } = await loadFixture(deployPOAPFixture);
      await expect(poapDapp.connect(user).mint(initialCode))
        .to.not.be.reverted;
      expect(await poapNFT.balanceOf(user.address)).to.equal(1);
      expect(await poapNFT.ownerOf(0)).to.equal(user.address);
    });

    it("Should prevent minting with invalid code", async function () {
      const { poapDapp, user } = await loadFixture(deployPOAPFixture);
      await expect(poapDapp.connect(user).mint("INVALIDCODE"))
        .to.be.revertedWithCustomError(poapDapp, "InvalidCode");
    });

    it("Should prevent minting if contract is stopped", async function () {
      const { poapDapp, initialCode, user, owner } = await loadFixture(deployPOAPFixture);
      await poapDapp.connect(owner).stopMinting();
      await expect(poapDapp.connect(user).mint(initialCode))
        .to.be.revertedWithCustomError(poapDapp, "MintingDisabled");
    });

    it("Should prevent minting if code is expired", async function () {
      const { poapDapp, initialCode, user } = await loadFixture(deployPOAPFixture);
      // Fast forward time by 25 days (past 24-day expiration)
      await time.increase(25 * 24 * 60 * 60);
      await expect(poapDapp.connect(user).mint(initialCode))
        .to.be.revertedWithCustomError(poapDapp, "MintingExpired");
    });

    it("Should prevent double minting", async function () {
      const { poapDapp, initialCode, user } = await loadFixture(deployPOAPFixture);
      await poapDapp.connect(user).mint(initialCode);
      await expect(poapDapp.connect(user).mint(initialCode))
        .to.be.revertedWithCustomError(poapDapp, "AlreadyMinted");
    });
  });

  describe("Soulbound Restrictions", function () {
    it("Should allow minting (initial transfer from address(0))", async function () {
      const { poapDapp, poapNFT, initialCode, user } = await loadFixture(deployPOAPFixture);
      await expect(poapDapp.connect(user).mint(initialCode)).to.not.be.reverted;
      expect(await poapNFT.balanceOf(user.address)).to.equal(1);
    });

    it("Should prevent transferring NFT to another address", async function () {
      const { poapDapp, poapNFT, initialCode, user, otherUser } = await loadFixture(deployPOAPFixture);
      await poapDapp.connect(user).mint(initialCode);
      await expect(poapNFT.connect(user).transferFrom(user.address, otherUser.address, 0))
        .to.be.revertedWith("Soulbound: Transfers are disabled");
    });

    it("Should prevent safe transferring NFT to another address", async function () {
      const { poapDapp, poapNFT, initialCode, user, otherUser } = await loadFixture(deployPOAPFixture);
      await poapDapp.connect(user).mint(initialCode);
      await expect(poapNFT.connect(user)["safeTransferFrom(address,address,uint256)"](
        user.address,
        otherUser.address,
        0
      )).to.be.revertedWith("Soulbound: Transfers are disabled");
    });
  });
});
