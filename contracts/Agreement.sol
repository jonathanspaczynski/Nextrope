// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Agreement {
    uint256 public id;
    uint256 public cost;
    uint256 public buyTime;

    address public initiator;
    address public buyer;
    address public arbiter;

    ERC20 public token;

    enum TransactionStatus {
        PENDING,
        ACTIVE,
        COMPLETED,
        SECURED
    }
    TransactionStatus public status;


    event BuyProduct(uint256 indexed _buyTime, address indexed _buyer);
    event ConfirmDelivery(address indexed _buyer);
    event PaymentReceived(address indexed _initiator, uint256 cost);
    event FundsSecured(address indexed _arbiter, address indexed recipient, uint256 amount);

    constructor(
        uint256 _cost,
        address _token,
        address _initiator,
        uint256 _id,
        address _arbiter
    ) {
        cost = _cost;
        token = ERC20(_token);
        initiator = _initiator;
        arbiter = msg.sender;
        id = _id;
        arbiter = _arbiter;
    }

    function buyProduct() external {
        require(status == TransactionStatus.PENDING, "Buyer already found");
        token.transferFrom(msg.sender, address(this), cost);

        buyer = msg.sender;
        status = TransactionStatus.ACTIVE;
        buyTime = block.timestamp;
        emit BuyProduct(buyTime, buyer);
    }

    function confirmDelivery() external {
        require(msg.sender == buyer, "Only the buyer can call this function");
        require(status == TransactionStatus.ACTIVE, "Active Status Error");
        status = TransactionStatus.COMPLETED;
        emit ConfirmDelivery(buyer);
    }

    function receivePayment() external {
        require(
            msg.sender == initiator,
            "Only the initiator can call this function"
        );
        require(
            status == TransactionStatus.COMPLETED,
            "Delivery has not yet been confirmed"
        );

        token.transfer(msg.sender, cost);
        emit PaymentReceived(initiator, cost);
    }

    function secureFunds(address _address, uint256 _amount) external {
        require(
            msg.sender == arbiter,
            "Only the arbiter can call this function"
        );
        token.transfer(_address, _amount);
        status = TransactionStatus.SECURED;
        emit FundsSecured(arbiter, _address, _amount);
    }

    function getAgreementData()
        external
        view
        returns (uint256, TransactionStatus, uint256, address)
    {
        return (buyTime, status, cost, address(token));
    }
}
