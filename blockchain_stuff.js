const NETWORK_ID = 534353

const SPLITER_CONTRACT_ADDRESS = "0x04Ad210Fa4Baa7b44f3993c94993fd4Fc0aFDA14"
const SUSD_CONTRACT_ADDRESS = "0xA501d054Cd417a656eeF60C455757CAC1dA741c1"
const SPLITER_CONTRACT_ABI_PATH = "./json_abi/Spliter.json"
const SUSD_CONTRACT_ABI_PATH = "./json_abi/SUSD.json"
var spliterContract
var sUSDContract

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
          sUSDContract = await getContract(web3, SUSD_CONTRACT_ADDRESS, SUSD_CONTRACT_ABI_PATH)
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
  //var greetingText = await spliterContract.methods.greetingText().call()
  //document.getElementById("contract_state").textContent = contract_state;

  var signature = "0xa095bf3bfa3477f1f4ae3c7185e69d9228acad8c4e29899b65a9f9b8a2b400471cbf7ab2ade7d56d1cb8d9aa11a6c61abdeb52e93924174481b06d2a83bdb8cd1c"
  var r = signature.slice(0, 66);
  var s = "0x" + signature.slice(66, 130);
  var v = parseInt(signature.slice(130, 132), 16);
  console.log(v)
  console.log(r)
  console.log(s)
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
  expenses.push(["a","x1",100])
  expenses.push(["a","x2",50])

  var senders = []
  senders.push("0x707e55a12557E89915D121932F83dEeEf09E5d70")
  senders.push("0xbef34f2FCAe62dC3404c3d01AF65a7784c9c4A19")

  var vs = []
  var rs = []
  var ss = []
  var signature = "0x0d836cc54e59b4d20a0f40495f9095ca037392d46a8aa2450118023c8ac447e360238bdb57e24ffa1f321dae123d9fea423673d8c9df4da863b8bb0afc895aa31b"
  var r = signature.slice(0, 66);
  var s = "0x" + signature.slice(66, 130);
  var v = parseInt(signature.slice(130, 132), 16);
  rs.push(r)
  ss.push(s)
  vs.push(v)
  var signature = "0x8fdd7eb4b1eaa5ab0263bf1470219cdf082029f89702847fd543e6cb6d9b18d26dc86ce921ae7c547c294187757f92f955032faadf3b6658227e5503cd3936fb1c"
  r = signature.slice(0, 66);
  s = "0x" + signature.slice(66, 130);
  v = parseInt(signature.slice(130, 132), 16);
  rs.push(r)
  ss.push(s)
  vs.push(v)

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

const addParticipant = async (group, account) => {
  const result = await spliterContract.methods.addParticipant(goup, account)
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

const approve = async () => {
  console.log(sUSDContract)
  const result = await sUSDContract.methods.approve(
    SPLITER_CONTRACT_ADDRESS,
    web3.utils.toWei('9999999999', 'ether')
  )
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