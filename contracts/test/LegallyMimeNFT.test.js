const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LegallyMimeNFT", function () {
  async function deploy() {
    const [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("LegallyMimeNFT");
    const nft = await Factory.deploy(owner.address);
    await nft.waitForDeployment();
    return { nft, owner, alice, bob };
  }

  async function createDefaultSeries(nft, overrides = {}) {
    const params = {
      name: "Series One — Classics",
      baseURI: "ipfs://QmTest/",
      maxSupply: 100,
      mintPrice: ethers.parseEther("0.1"),
      maxPerWallet: 5,
      active: true,
      ...overrides,
    };
    const tx = await nft.createSeries(
      params.name,
      params.baseURI,
      params.maxSupply,
      params.mintPrice,
      params.maxPerWallet,
      params.active
    );
    await tx.wait();
    return params;
  }

  it("deploys with correct name/symbol and owner", async function () {
    const { nft, owner } = await deploy();
    expect(await nft.name()).to.equal("Legally Mime");
    expect(await nft.symbol()).to.equal("LMIME");
    expect(await nft.owner()).to.equal(owner.address);
  });

  it("creates series and exposes view data", async function () {
    const { nft } = await deploy();
    await createDefaultSeries(nft);
    expect(await nft.seriesCount()).to.equal(1n);

    const s = await nft.getSeries(1);
    expect(s.name_).to.equal("Series One — Classics");
    expect(s.maxSupply_).to.equal(100n);
    expect(s.minted_).to.equal(0n);
    expect(s.active_).to.equal(true);
    expect(s.exists_).to.equal(true);
  });

  it("mints with correct payment and tracks series", async function () {
    const { nft, alice } = await deploy();
    const params = await createDefaultSeries(nft);

    await expect(
      nft.connect(alice).mint(1, 2, { value: params.mintPrice * 2n })
    )
      .to.emit(nft, "Minted")
      .withArgs(1, alice.address, 1, params.mintPrice);

    expect(await nft.ownerOf(1)).to.equal(alice.address);
    expect(await nft.ownerOf(2)).to.equal(alice.address);
    expect(await nft.tokenSeries(1)).to.equal(1n);
    expect(await nft.balanceOf(alice.address)).to.equal(2n);
    expect(await nft.mintedPerWallet(1, alice.address)).to.equal(2n);

    const s = await nft.getSeries(1);
    expect(s.minted_).to.equal(2n);
    expect(await nft.tokenURI(1)).to.equal("ipfs://QmTest/1.json");
  });

  it("rejects underpayment and inactive / sold-out / wallet limit", async function () {
    const { nft, alice } = await deploy();
    const params = await createDefaultSeries(nft, { maxSupply: 3, maxPerWallet: 2 });

    await expect(nft.connect(alice).mint(1, 1, { value: 0 })).to.be.revertedWith(
      "insufficient payment"
    );

    await nft.setSeriesActive(1, false);
    await expect(
      nft.connect(alice).mint(1, 1, { value: params.mintPrice })
    ).to.be.revertedWith("series inactive");
    await nft.setSeriesActive(1, true);

    await nft.connect(alice).mint(1, 2, { value: params.mintPrice * 2n });
    await expect(
      nft.connect(alice).mint(1, 1, { value: params.mintPrice })
    ).to.be.revertedWith("wallet limit");
  });

  it("ownerMint bypasses payment and active flag", async function () {
    const { nft, alice } = await deploy();
    await createDefaultSeries(nft, { active: false });
    await nft.ownerMint(1, alice.address, 1);
    expect(await nft.ownerOf(1)).to.equal(alice.address);
  });

  it("supports multiple series", async function () {
    const { nft, alice, bob } = await deploy();
    await createDefaultSeries(nft, { name: "Classics", mintPrice: ethers.parseEther("0.1") });
    await createDefaultSeries(nft, {
      name: "Legal Briefs",
      maxSupply: 50,
      mintPrice: ethers.parseEther("0.5"),
      baseURI: "ipfs://QmBriefs/",
    });

    await nft.connect(alice).mint(1, 1, { value: ethers.parseEther("0.1") });
    await nft.connect(bob).mint(2, 1, { value: ethers.parseEther("0.5") });

    expect(await nft.tokenSeries(1)).to.equal(1n);
    expect(await nft.tokenSeries(2)).to.equal(2n);
    expect(await nft.tokenURI(2)).to.equal("ipfs://QmBriefs/2.json");
    expect(await nft.seriesCount()).to.equal(2n);
  });

  it("refunds excess payment and allows withdraw", async function () {
    const { nft, owner, alice } = await deploy();
    const price = ethers.parseEther("0.1");
    await createDefaultSeries(nft, { mintPrice: price });

    const before = await ethers.provider.getBalance(alice.address);
    const tx = await nft.connect(alice).mint(1, 1, { value: ethers.parseEther("1") });
    const receipt = await tx.wait();
    const gas = receipt.gasUsed * receipt.gasPrice;
    const after = await ethers.provider.getBalance(alice.address);

    // paid ~0.1 + gas, not full 1 ETH
    expect(before - after - gas).to.be.closeTo(price, ethers.parseEther("0.001"));

    const ownerBefore = await ethers.provider.getBalance(owner.address);
    const wtx = await nft.withdraw();
    const wreceipt = await wtx.wait();
    const wgas = wreceipt.gasUsed * wreceipt.gasPrice;
    const ownerAfter = await ethers.provider.getBalance(owner.address);
    expect(ownerAfter - ownerBefore + wgas).to.equal(price);
  });

  it("enumerates tokens", async function () {
    const { nft, alice } = await deploy();
    await createDefaultSeries(nft);
    await nft.connect(alice).mint(1, 3, { value: ethers.parseEther("0.3") });
    expect(await nft.totalSupply()).to.equal(3n);
    expect(await nft.tokenOfOwnerByIndex(alice.address, 0)).to.equal(1n);
  });
});
