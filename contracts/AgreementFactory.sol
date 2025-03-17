// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Agreement.sol";

contract AgreementFactory {
    uint256 public id;

    address public owner;
    address public token;

    mapping(uint256 => address) public agreements;

    event CreateAgreement(uint256 indexed  _id, uint256 _cost, address _agreementAddress);

    constructor(address _token) {
        owner = msg.sender;
        token = _token;
    }

    function createAgreement(uint256 _cost) external {
        uint256 agreementId = id;
        Agreement agreement = new Agreement(
            _cost,
            token,
            msg.sender,
            agreementId,
            owner
        );
        agreements[agreementId] = address(agreement);

        id = id + 1;
        emit CreateAgreement(agreementId, _cost, address(agreement));
    }
}
