// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract Spliter {
    IERC20 tokenContract;

    mapping(string group => mapping(address account => bool isInGroup)) accountIsInGroup;
    mapping(string group => uint size) groupSize;

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

    struct AccountTotalExpenses
    {
        address account;
        uint amount;
    }

    // Public functions

    function addPartitipant(string memory group, address account) public {
        if(!accountIsInGroup[group][account])
        {
            groupSize[group] += 1;
        }
        accountIsInGroup[group][account] = true;
    }

    function splitExpenses(Expense[] memory expenses,
        address[] memory sender,
        uint8[] memory v,
        bytes32[] memory r,
        bytes32[] memory s) public
    {
        uint groupSizeTemp = groupSize[expenses[0].group];
        uint totalExpenses;
        AccountTotalExpenses[] memory accountTotalExpenses = new AccountTotalExpenses[](groupSizeTemp);
        uint acountExpensesCount;
        
        for(uint i=0; i<expenses.length; i++) // Calculate total expenses and accountTotalExpenses
        {
            totalExpenses += expenses[i].amount;
            bool accountExists = false;

            require(verify(expenses[i], sender[i], v[i], r[i], s[i]), "Invalid signature");
            
            for(uint j=0; j<accountTotalExpenses.length; j++)
            {
                if(accountTotalExpenses[j].account == sender[i])
                {
                    accountExists = true;
                    accountTotalExpenses[j].amount += expenses[i].amount;
                    break;
                }
            }
            if(!accountExists)
            {
                accountTotalExpenses[acountExpensesCount] = AccountTotalExpenses(sender[i], expenses[i].amount);
                acountExpensesCount+=1;
            }
        }

        /*
        for(uint i=0; i<accountTotalExpenses.length; i++) // Split
        {
            uint currentOwed = totalExpenses - accountTotalExpenses[i].amount;
            for(uint j=0; j<accountTotalExpenses.length; j++)
            {
                if(accountTotalExpenses[i].account != accountTotalExpenses[j].account)
                {
                    tokenContract.transferFrom(
                        accountTotalExpenses[i].account,
                        accountTotalExpenses[j].account,
                        currentOwed/(groupSizeTemp-1));
                }
            }
        }
        */
    }
}