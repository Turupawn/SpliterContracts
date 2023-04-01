// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

contract Spliter {
    string public group = "oas";
    string public greetingText = "Hello World!";
    address public greetingSender;

    struct EIP712Domain {
        string  name;
        string  version;
        uint256 chainId;
        address verifyingContract;
    }

    struct Expense {
        string group;
        string description;
        uint amount;
    }

    bytes32 DOMAIN_SEPARATOR;

    constructor () {
        DOMAIN_SEPARATOR = hash(EIP712Domain({
            name: "Ether Mail",
            version: '1',
            chainId: block.chainid,
            verifyingContract: address(this)
        }));
    }

    function hash(EIP712Domain memory eip712Domain) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes(eip712Domain.name)),
            keccak256(bytes(eip712Domain.version)),
            eip712Domain.chainId,
            eip712Domain.verifyingContract
        ));
    }

    function hash(Expense memory expense) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            keccak256("Expense(string group,string description,uint amount)"),
            keccak256(bytes(expense.group)),
            keccak256(bytes(expense.description)),
            expense.amount
        ));
    }

    function verify(Expense memory expense, address sender, uint8 v, bytes32 r, bytes32 s) public view returns (bool) {
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR,
            hash(expense)
        ));
        return ecrecover(digest, v, r, s) == sender;
    }

    uint public totalAmount;
    function splitExpenses(Expense[] memory expenses,
        address[] memory sender,
        uint8[] memory v,
        bytes32[] memory r,
        bytes32[] memory s) public
    {
        for(uint i=0; i<expenses.length; i++)
        {
            totalAmount += expenses[i].amount;
        }
    }
}