const NETWORK_ID = 534353

const SPLITER_CONTRACT_ADDRESS = "0x7deCBDA8E608066a20B1aa98061C7F850dE1330d"
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

async function signMessage(description, amount)
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
        group: description,
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

async function relayGreeting(greetingText, greetingDeadline, greetingSender, signature)
{
  const r = signature.slice(0, 66);
  const s = "0x" + signature.slice(66, 130);
  const v = parseInt(signature.slice(130, 132), 16);
  console.log({v,r,s})

  var url = "http://localhost:8080/relay?"
  url += "greetingText=" + greetingText
  url += "&greetingDeadline=" + greetingDeadline
  url += "&greetingSender=" + greetingSender
  url += "&v=" + v
  url += "&r=" + r
  url += "&s=" + s

  const relayRequest = new Request(url, {
    method: 'GET',
    headers: new Headers(),
    mode: 'cors',
    cache: 'default',
  });

  fetch(relayRequest);

  alert("Message sent!")
}