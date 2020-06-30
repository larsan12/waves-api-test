const { create } = require('@vostokplatform/waves-api');
const nodeFetch = require('node-fetch');
// шифрование голосов
const Encrypt = require('@vostokplatform/voting-encrypt');

/*  Вызов voting контракта TODO  */

// CONFIG:

// адресс ноды
const NODE_ADDRESS = 'https://obama.vostokservices.com/node-0';

// фраза для адреса с ролью contract_developer для возможности публикации и вызовов контрактов
// подробнее об управлению ролями https://docs.wavesenterprise.com/ru/1.2.2/how-to-use/role-management.html
// если будет надо - сделаем дополнительный example для работы с ролями
const seedPhrase = 'radar company fluid sweet normal gown appear naive foster cereal forum idea change index energy';

// обёртка для fetch с нужной авторизацией и прочими вещами
// авторизация может отсутствовать в зависимости от параметров ноды
const fetch = (url, options = {}) => {
  const headers = options.headers || {}
  return nodeFetch(url, { ...options, headers: {...headers, 'x-api-key': 'vostok'} });
}

(async () => {

  // достаём байт сети из конфига ноды
  const { chainId } = await (await fetch(`${NODE_ADDRESS}/node/config`)).json();

  const initialConfiguration = {
    nodeAddress: NODE_ADDRESS,
    matcherAddress: 'https://matcher.wavesplatform.com/matcher',
    // минимальная длина сидового адреса при генерации
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
  const contractId = 'someСontractId';
  // Получение конфига ноды
  const { data: nodeConfig } = await this.axios.get(`${NODE_ADDRESS}/node/config`)
  // Получение keyPair
  const { keyPair } = Waves.Seed.fromExistingPhrase(seedPhrase);
  // Получение параметров для шифрования
  const {
    date: { base_point: basePoint, hash_length: hashLength, q }
  } = await axios.get(`${CRYPTO_SERVICE_ADDRESS}/v1/getParamSet`);
  // получение mainKey
  const { data: mainKeyData } = await axios.get(`${NODE_ADDRESS}/contracts/${contractId}/MAIN_KEY`);
  const mainKey = JSON.parse(data.value);
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
      type: ParamType.string,
      key,
      value
    };
  }

  const data = {
    senderPublicKey: keyPair,
    authorPublicKey: keyPair,
    contractId,
    timestamp: Date.now(),
    params: [{ type: 'string', key: 'operation', value: 'vote' }, ...Object.entries(contractParams).map(mapVoteParams)],
    nodeConfig.minimumFee[104]
  };

  Waves.API.Node.transactions.broadcastFromClientAddress(
    "dockerCall",
    data,
    keyPair
  );
})();
