const { create } = require('@vostokplatform/waves-api');
const nodeFetch = require('node-fetch');
// шифрование голосов
const Encrypt = require('@vostokplatform/voting-encrypt').default;

/*  Вызов voting контракта TODO  */

// CONFIG:

// адресс ноды
const NODE_ADDRESS = 'https://lika.vostokservices.com/nodeAddress';
// адресс крипто сервиса
const CRYPTO_SERVICE_ADDRESS = 'https://voting.vostokservices.com/cryptoService'

// фраза для адреса с ролью contract_developer для возможности публикации и вызовов контрактов
// подробнее об управлению ролями https://docs.wavesenterprise.com/ru/1.2.2/how-to-use/role-management.html
// если будет надо - сделаем дополнительный example для работы с ролями
const seedPhrase = 'ordinary life clinic layer ocean panel above aisle fold phrase ramp sock page again valid';

// id созданного контракта воатинга, как создать его - сделаем отдельный пример
const contractId = '8HEpdRmA2rwJGcPmF2v1uvC2Z7ZAeaLCGW7rDLj3M8yK';

// обёртка для fetch с нужной авторизацией и прочими вещами
// авторизация может отсутствовать в зависимости от параметров ноды
const fetch = (url, options = {}) => {
  const headers = options.headers || {}
  return nodeFetch(url, { ...options, headers: {...headers, 'x-api-key': 'vostok'} });
}

(async () => {

  // достаём байт сети из конфига ноды
  const {minimumFee, chainId} = await (await nodeFetch(`${NODE_ADDRESS}/node/config`)).json();

  const initialConfiguration = {
    nodeAddress: NODE_ADDRESS,
    matcherAddress: 'https://matcher.wavesplatform.com/matcher',
    minimumSeedLength: 25,
    // включаем гост криптографию
    crypto: 'gost',
    // байт сети - взяли из конфига ноды
    networkByte: chainId.charCodeAt(0),
  };

  // создаём api
  const Waves = create({
    initialConfiguration,
    fetchInstance: fetch
  });

  // бюллетень
  const votes = [[0,1], [1,0], [0,1]]

  // Получение keyPair
  const { keyPair } = Waves.Seed.fromExistingPhrase(seedPhrase);
  // Получение параметров для шифрования
  const {
    base_point: basePoint, hash_length: hashLength, q
  } = await(await fetch(`${CRYPTO_SERVICE_ADDRESS}/v1/getParamSet`)).json();
  // получение mainKey
  const {value} = await (await fetch(`${NODE_ADDRESS}/contracts/${contractId}/MAIN_KEY`)).json();
  const mainKey = value ? JSON.parse(value) : "";
  // создание инстанса Encrypt
  const enc = new Encrypt({
    mainKey,
    basePoint,
    hashLength,
    q
  });
  // шифрование
  const encrypted = votes.map((v) => enc.makeEncryptedBulletin(v));

  const contractParams = {
    vote: JSON.stringify(encrypted)
  }

  function mapVoteParams(args) {
    const [key, value] = args;
    return {
      type: 'string',
      key,
      value
    };
  }

  const data = {
    senderPublicKey: keyPair.publicKey,
    authorPublicKey: keyPair.publicKey,
    contractId,
    contractVersion: 1,
    timestamp: Date.now(),
    params: [{ type: 'string', key: 'operation', value: 'vote' }, ...Object.entries(contractParams).map(mapVoteParams)],
    fee: minimumFee[104]
  };

  // методы waves-api
  try {
    // метод waves-api на подписание транзакции вызова контракта
    const signedTx = await Waves.API.Node.transactions.sign('dockerCallV2', data, keyPair);
    // подписанную транзакцию отправлять на ноду в эндпоинт /transactions/broadcast
    console.log('Signed tx: ')
    console.log(signedTx)

    // метод waves-api на вызов контракта - сразу подписывает и отправляет транзакцию
    const result = await Waves.API.Node.transactions.broadcastFromClientAddress('dockerCallV2', data, keyPair);
    console.log('Success!')
    console.log(result)
  } catch (err) {
    console.log(`Error: ${err.data.error} Reason: ${err.data.message}`)
  }


})();
