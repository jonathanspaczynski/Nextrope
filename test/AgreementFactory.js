const { expect } = require("chai");

let arbiter, seller;
let token, factory;

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
const TEN = "10000000000000000000";

async function setup() {
  [arbiter, seller] = await ethers.getSigners();
  const Token = await ethers.getContractFactory("Token");
  token = await Token.deploy(arbiter.address);

  const AgreementFactory = await ethers.getContractFactory("AgreementFactory");
  factory = await AgreementFactory.deploy(token.target);
}

describe("AgreementFactory", function () {
  before(async function () {
    await setup();
  });

  it("Should check if initial values are set properly ", async function () {
    expect(arbiter.address).is.equal(await factory.owner());
    expect(token.target).is.equal(await factory.token());
    expect(await factory.agreements(0)).is.equal(NULL_ADDRESS);
  });

  it("Should let seller mint an Agreement contract", async function () {
    await factory.connect(seller).createAgreement(TEN);
    const events = await factory.queryFilter(factory.filters.CreateAgreement());

    expect(events.length).to.equal(1);

    const { 0: _id, 1: _cost, 2: _address } = events[0].args;

    expect(0).to.equal(_id);
    expect(TEN).to.equal(_cost);
    expect(NULL_ADDRESS).to.not.equal(_address);

    expect(_address).is.equal(await factory.agreements(_id))
  });
});
