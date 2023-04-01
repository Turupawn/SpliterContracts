const NETWORK_ID = 534353

const SPLITER_CONTRACT_ADDRESS = "0x3F2FF862c047013457311B9642A41B1988AbB77d"
const SPLITER_CONTRACT_ABI_PATH = "./json_abi/Spliter.json"
var spliterContract

var accounts
var web3

function metamaskReloadCallback() {
  window.ethereum.on('accountsChanged', (accounts) => {
    document.getElementById("web3_message").textContent="Se cambió el account, refrescando...";
    window.location.reload()
  })
  window.ethereum.on('networkChanged', (accounts) => {
    document.getElementById("web3_message").textContent="Se el network, refrescando...";
    window.location.reload()
  })
}

const getWeb3 = async () => {
  return new Promise((resolve, reject) => {
    if(document.readyState=="complete")
    {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum)
        window.location.reload()
        resolve(web3)
      } else {
        reject("must install MetaMask")
        document.getElementById("web3_message").textContent="Error: Porfavor conéctate a Metamask";
      }
    }else
    {
      window.addEventListener("load", async () => {
        if (window.ethereum) {
          const web3 = new Web3(window.ethereum)
          resolve(web3)
        } else {
          reject("must install MetaMask")
          document.getElementById("web3_message").textContent="Error: Please install Metamask";
        }
      });
    }
  });
};

const getContract = async (web3, address, abi_path) => {
  const response = await fetch(abi_path);
  const data = await response.json();

  const netId = await web3.eth.net.getId();
  contract = new web3.eth.Contract(
    data,
    address
    );
  return contract
}

async function loadDapp() {
  metamaskReloadCallback()
  document.getElementById("web3_message").textContent="Please connect to Metamask"
  var awaitWeb3 = async function () {
    web3 = await getWeb3()
    web3.eth.net.getId((err, netId) => {
      if (netId == NETWORK_ID) {
        var awaitContract = async function () {
          spliterContract = await getContract(web3, SPLITER_CONTRACT_ADDRESS, SPLITER_CONTRACT_ABI_PATH)
          document.getElementById("web3_message").textContent="You are connected to Metamask"
          onContractInitCallback()
          web3.eth.getAccounts(function(err, _accounts){
            accounts = _accounts
            if (err != null)
            {
              console.error("An error occurred: "+err)
            } else if (accounts.length > 0)
            {
              onWalletConnectedCallback()
              document.getElementById("account_address").style.display = "block"
            } else
            {
              document.getElementById("connect_button").style.display = "block"
            }
          });
        };
        awaitContract();
      } else {
        document.getElementById("web3_message").textContent="Please connect to Goerli";
      }
    });
  };
  awaitWeb3();
}

async function connectWallet() {
  await window.ethereum.request({ method: "eth_requestAccounts" })
  accounts = await web3.eth.getAccounts()
  onWalletConnectedCallback()
}

loadDapp()

const onContractInitCallback = async () => {
  var greetingText = await spliterContract.methods.greetingText().call()
  var greetingSender = await spliterContract.methods.greetingSender().call()

  var contract_state = "Greeting Text: " + greetingText
    + ", Greeting Setter: " + greetingSender

  document.getElementById("contract_state").textContent = contract_state;
}

const onWalletConnectedCallback = async () => {
}

// Sign and Relay functions

async function signMessage(group, description, amount)
{
  const msgParams = JSON.stringify({
    types: {
        EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
        ],
        Expense: [
            { name: 'group', type: 'string' },
            { name: 'description', type: 'string' },
            { name: 'amount', type: 'uint' }
        ],
    },
    primaryType: 'Expense',
    domain: {
        name: 'Ether Mail',
        version: '1',
        chainId: NETWORK_ID,
        verifyingContract: SPLITER_CONTRACT_ADDRESS,
    },
    message: {
        group: group,
        description: description,
        amount: amount,
    },
  });
  console.log(msgParams)

  const signature = await ethereum.request({
    method: "eth_signTypedData_v4",
    params: [accounts[0], msgParams],
  });

  document.getElementById("signature").textContent="Signature: " + signature;
}

async function split()
{
  var expenses = []
  expenses.push(["1","2",3])

  var senders = []
  senders.push("0x707e55a12557E89915D121932F83dEeEf09E5d70")

  var vs = []
  var rs = []
  var ss = []
  var signature = "0xcd275d809982d81844bd73101b6f67802fde400bfee0bb93546983b1b1f80c7a66f77ce5257da17e7c34e55401d4ef56bca7e2a46d1371344b6c233ca6855d561b"
  var r = signature.slice(0, 66);
  var s = "0x" + signature.slice(66, 130);
  var v = parseInt(signature.slice(130, 132), 16);
  rs.push(r)
  ss.push(s)
  vs.push(v)

  senders.push()
  await splitExpenses(
    expenses,
    senders,
    vs,
    rs,
    ss)
}

const splitExpenses = async (expenses, senders, vs, rs, ss) => {
  const result = await spliterContract.methods.splitExpenses(expenses, senders, vs, rs, ss)
  .send({ from: accounts[0], gas: 0, value: 0 })
  .on('transactionHash', function(hash){
    document.getElementById("web3_message").textContent="Executing...";
  })
  .on('receipt', function(receipt){
    document.getElementById("web3_message").textContent="Success.";    })
  .catch((revertReason) => {
    console.log("ERROR! Transaction reverted: " + revertReason.receipt.transactionHash)
  });
}