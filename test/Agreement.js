const { expect } = require("chai");
const { ethers } = require("hardhat");

let arbiter, seller, buyer, disputedFunds;
let token, factory, agreement, agreement2;
let provider;

const TEN = "10000000000000000000";
const HUNDRED = "100000000000000000000";

async function setup() {
  provider = ethers.provider;
  [arbiter, seller, buyer, disputedFunds] = await ethers.getSigners();
  const Token = await ethers.getContractFactory("Token");
  token = await Token.deploy(arbiter.address);

  const AgreementFactory = await ethers.getContractFactory("AgreementFactory");
  factory = await AgreementFactory.deploy(token.target);
}

describe("AgreementFactory", function () {
  before(async function () {
    await setup();
  });

  it("Should verify that Agreement contract is set up properly", async function () {
    await factory.connect(seller).createAgreement(TEN);
    const events = await factory.queryFilter(factory.filters.CreateAgreement());

    const { 2: _address } = events[0].args;

    const Agreement = await ethers.getContractFactory("Agreement");
    agreement = new ethers.Contract(_address, Agreement.interface, provider);

    const {
      0: _buyTime,
      1: _status,
      2: _cost,
      3: _tokenAddress,
    } = await agreement.getAgreementData();

    expect(0).is.equal(_buyTime);
    expect(0).is.equal(_status);
    expect(TEN).is.equal(_cost);
    expect(token.target).is.equal(_tokenAddress);

    expect(seller.address).is.equal(await agreement.initiator());
    expect(arbiter.address).is.equal(await agreement.arbiter());
    expect(0).is.equal(await agreement.id());
  });

  it("Should allow a user to buy the product", async function () {
    await token.transfer(buyer, HUNDRED);
    await token.connect(buyer).approve(agreement, TEN);

    await agreement.connect(buyer).buyProduct();
    const { 0: _buyTime, 1: _status } = await agreement.getAgreementData();

    expect(0).is.not.equal(_buyTime);
    expect(1).is.equal(_status);
    expect(buyer.address).is.equal(await agreement.buyer());
  });

  it("Should fail if someone tries to buy the product again", async function () {
    await expect(agreement.connect(buyer).buyProduct()).to.be.revertedWith(
      "Buyer already found"
    );
  });

  it("Should fail if seller tries to receive payment before delivery confirmation", async function () {
    await expect(agreement.connect(seller).receivePayment()).to.be.revertedWith(
      "Delivery has not yet been confirmed"
    );
  });

  it("Should fail if anyone but seller tries to receive the payment", async function () {
    await expect(agreement.connect(buyer).receivePayment()).to.be.revertedWith(
      "Only the initiator can call this function"
    );
  });

  it("Should fail if anyone but buyer tries to confirm delivery", async function () {
    await expect(
      agreement.connect(seller).confirmDelivery()
    ).to.be.revertedWith("Only the buyer can call this function");
  });

  it("Should allow the buyer to confirm delivery", async function () {
    await agreement.connect(buyer).confirmDelivery();
    const { 1: _status } = await agreement.getAgreementData();
    expect(2).is.equal(_status);
  });

  it("Should fail if buyer tries to confim delivery twice", async function () {
    await expect(agreement.connect(buyer).confirmDelivery()).to.be.revertedWith(
      "Active Status Error"
    );
  });

  it("Should fail if not arbiter tries to call secureFunds", async function () {
    await expect(agreement.connect(buyer).secureFunds(buyer.address, TEN)).to.be.revertedWith(
      "Only the arbiter can call this function"
    );
  });

  it("Should allow the seller to receive payment", async function () {
    await agreement.connect(seller).receivePayment();
    expect(await token.balanceOf(seller.address)).is.equal(TEN);
  });

  it("Should allow a user to create a second agreement", async function () {
    await factory.connect(seller).createAgreement(TEN);
    const events = await factory.queryFilter(factory.filters.CreateAgreement());
    const { 2: _address } = events[1].args;

    const Agreement = await ethers.getContractFactory("Agreement");
    agreement2 = new ethers.Contract(_address, Agreement.interface, provider);
  });

  it("Should allow an arbiter to secure the funds", async function () {
    await token.connect(buyer).approve(agreement2, TEN);
    await agreement2.connect(buyer).buyProduct();

    await agreement2.connect(arbiter).secureFunds(disputedFunds, TEN)
    expect(await token.balanceOf(disputedFunds.address)).is.equal(TEN);
  });
});
