const routerAbi = [/* Your Router ABI goes here */];
const tokenAbi = [
  {
    "constant":true,
    "inputs":[],
    "name":"name",
    "outputs":[{"name":"","type":"string"}],
    "type":"function"
  },
  {
    "constant":true,
    "inputs":[],
    "name":"symbol",
    "outputs":[{"name":"","type":"string"}],
    "type":"function"
  },
  {
    "constant":true,
    "inputs":[],
    "name":"decimals",
    "outputs":[{"name":"","type":"uint8"}],
    "type":"function"
  },
  {
    "constant":false,
    "inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],
    "name":"approve",
    "outputs":[{"name":"","type":"bool"}],
    "type":"function"
  }
];
const routerAddress = '0xYourRouterAddress'; // Replace with deployed router

const coreNetwork = {
  chainId: '0x45C',
  chainName: 'CoreDAO',
  nativeCurrency: {
    name: 'CORE',
    symbol: 'CORE',
    decimals: 18
  },
  rpcUrls: ['https://rpc.coredao.org'],
  blockExplorerUrls: ['https://scan.coredao.org']
};

let web3, user;

async function connectWallet() {
  if (!window.ethereum) return alert('Install MetaMask!');
  web3 = new Web3(window.ethereum);
  await ethereum.request({ method: 'eth_requestAccounts' });
  const accounts = await web3.eth.getAccounts();
  user = accounts[0];
  document.getElementById('walletStatus').textContent = `Wallet Connected: ${user}`;
}

async function switchToCoreDAO() {
  try {
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [coreNetwork],
    });
  } catch (e) {
    alert('Network switch failed.');
  }
}

async function showTokenInfo(inputId, infoId) {
  const address = document.getElementById(inputId).value.trim();
  if (!web3 || !web3.utils.isAddress(address)) {
    document.getElementById(infoId).textContent = 'Invalid address';
    return;
  }

  try {
    const token = new web3.eth.Contract(tokenAbi, address);
    const name = await token.methods.name().call();
    const symbol = await token.methods.symbol().call();
    const decimals = await token.methods.decimals().call();
    document.getElementById(infoId).textContent = `Name: ${name} | Symbol: ${symbol} | Decimals: ${decimals}`;
  } catch {
    document.getElementById(infoId).textContent = 'Token info not found';
  }
}

async function swapTokens() {
  const from = document.getElementById('fromToken').value;
  const to = document.getElementById('toToken').value;
  const amount = document.getElementById('amount').value;
  const slippage = parseFloat(document.getElementById('slippage').value || '0.5');

  const router = new web3.eth.Contract(routerAbi, routerAddress);
  const token = new web3.eth.Contract(tokenAbi, from);
  const weiAmount = web3.utils.toWei(amount, 'ether');
  await token.methods.approve(routerAddress, weiAmount).send({ from: user });

  const path = [from, to];
  const amounts = await router.methods.getAmountsOut(weiAmount, path).call();
  const minOut = (amounts[1] * (100 - slippage)) / 100;
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  await router.methods.swapExactTokensForTokens(
    weiAmount, Math.floor(minOut), path, user, deadline
  ).send({ from: user });

  alert('Swap successful!');
}

async function addLiquidity() {
  const tokenA = document.getElementById('liqTokenA').value;
  const tokenB = document.getElementById('liqTokenB').value;
  const amountA = web3.utils.toWei(document.getElementById('liqAmountA').value, 'ether');
  const amountB = web3.utils.toWei(document.getElementById('liqAmountB').value, 'ether');

  const router = new web3.eth.Contract(routerAbi, routerAddress);
  const a = new web3.eth.Contract(tokenAbi, tokenA);
  const b = new web3.eth.Contract(tokenAbi, tokenB);

  await a.methods.approve(routerAddress, amountA).send({ from: user });
  await b.methods.approve(routerAddress, amountB).send({ from: user });

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
  await router.methods.addLiquidity(
    tokenA, tokenB, amountA, amountB, 0, 0, user, deadline
  ).send({ from: user });

  alert('Liquidity added!');
}
