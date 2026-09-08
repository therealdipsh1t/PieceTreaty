const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PieceTreatyFilings", function () {
  async function deploy() {
    const [owner, minter, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("PieceTreatyFilings");
    const filings = await Factory.deploy(owner.address, "http://localhost:5173/courthouse/cards/");
    await filings.waitForDeployment();
    return { filings, owner, minter, alice, bob };
  }

  async function registerChase(filings, id = 1n) {
    await filings.registerCard(id, "Legally Mime", true, 100, "");
  }

  it("registers chase cards and exposes catalog views", async function () {
    const { filings } = await deploy();
    await registerChase(filings);
    expect(await filings.registeredCount()).to.equal(1n);

    const c = await filings.getCard(1);
    expect(c.name_).to.equal("Legally Mime");
    expect(c.registered_).to.equal(true);
    expect(c.chase_).to.equal(true);
    expect(c.maxSupply_).to.equal(100n);
    expect(c.filed_).to.equal(0n);
  });

  it("lets the minter file copies to a player", async function () {
    const { filings, owner, alice } = await deploy();
    await registerChase(filings);

    await expect(filings.connect(owner).file(alice.address, 1, 2))
      .to.emit(filings, "Filed")
      .withArgs(1, alice.address, 2);

    expect(await filings.balanceOf(alice.address, 1)).to.equal(2n);
    expect(await filings["totalSupply(uint256)"](1)).to.equal(2n);
  });

  it("rejects filing unknown, non-chase, or over-cap cards", async function () {
    const { filings, alice } = await deploy();
    await filings.registerCard(2, "Red Balloon", false, 0, "");

    await expect(filings.file(alice.address, 99, 1)).to.be.revertedWith("unknown card");
    await expect(filings.file(alice.address, 2, 1)).to.be.revertedWith("not chase");

    await filings.registerCard(1, "Legally Mime", true, 1, "");
    await filings.file(alice.address, 1, 1);
    await expect(filings.file(alice.address, 1, 1)).to.be.revertedWith("supply cap");
  });

  it("only minter can file; holder or minter can unfile", async function () {
    const { filings, minter, alice, bob } = await deploy();
    await registerChase(filings);
    await filings.setMinter(minter.address, true);

    await expect(filings.connect(alice).file(alice.address, 1, 1)).to.be.reverted;
    await filings.connect(minter).file(alice.address, 1, 3);

    await expect(filings.connect(bob).unfile(alice.address, 1, 1)).to.be.revertedWith("not allowed");
    await filings.connect(alice).unfile(alice.address, 1, 1);
    expect(await filings.balanceOf(alice.address, 1)).to.equal(2n);

    await filings.connect(minter).unfile(alice.address, 1, 2);
    expect(await filings.balanceOf(alice.address, 1)).to.equal(0n);
  });

  it("transfers filed copies between players", async function () {
    const { filings, alice, bob } = await deploy();
    await registerChase(filings);
    await filings.file(alice.address, 1, 1);
    await filings.connect(alice).safeTransferFrom(alice.address, bob.address, 1, 1, "0x");
    expect(await filings.balanceOf(bob.address, 1)).to.equal(1n);
    expect(await filings.balanceOf(alice.address, 1)).to.equal(0n);
  });
});
