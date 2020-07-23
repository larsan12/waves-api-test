const { create, MAINNET_CONFIG } = require('@vostokplatform/waves-api');
const nodeFetch = require('node-fetch');
// шифрование голосов
const Encrypt = require('@vostokplatform/voting-encrypt').default;
const { init } = require("@vostokplatform/api-token-refresher/fetch");

/*  Вызов voting контракта TODO  */

// CONFIG:

// адресс ноды
const NODE_ADDRESS = 'http://blockchain.dev.gas20.ru/nodeAddress';
// адресс крипто сервиса
const CRYPTO_SERVICE_ADDRESS = 'http://192.168.40.160:3010'

// фраза для адреса с ролью contract_developer для возможности публикации и вызовов контрактов
// подробнее об управлению ролями https://docs.wavesenterprise.com/ru/1.2.2/how-to-use/role-management.html
// если будет надо - сделаем дополнительный example для работы с ролями
const seedPhrase = 'tired pear empower sadness until shoe size pipe force other slender impose service hockey glow';

// id созданного контракта воатинга, как создать его - сделаем отдельный пример
const contractId = '4TazCybMVSvDnpw7akJy7odnC8Pj5U5nC5Hv71tZWdPt';

const { fetch: authorizedFetch } = init({
  authorization: {
    access_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE4ZmRlNmZkLTBjZjUtNDJjMC1hYmZiLWE4NTgyMzk4ODNkNCIsIm5hbWUiOiJub3ZvZW15bG9AbXlsby5jb20iLCJsb2NhbGUiOiJydSIsImFkZHJlc3NlcyI6W3siYWRkcmVzcyI6IjNNRnVSMXlpYXByM3NTQ1Y0QWJIZHROTHFGUzRlOFlnRzZGIiwidHlwZSI6ImNsaWVudCIsIm5hbWUiOiLQsNC00YDQtdGBINC60L7RgtC-0YDRi9C5INCx0YPQtNC10YIg0L_QvtGC0LXRgNGP0L0ifSx7ImFkZHJlc3MiOiIzRlBaRDVvU2Jadkd5WWFON3dRclpiZGhRdlU5TGUzaWFVNyIsInR5cGUiOiJjbGllbnQiLCJuYW1lIjoiZGVjcnlwdC0wIn0seyJhZGRyZXNzIjoiM001MXp3d245dFlMRUpneWNDeVpGUnptNXo1a3ZaUGtuQnQiLCJ0eXBlIjoiY2xpZW50IiwibmFtZSI6ItC70Y7QsdC-0Lkg0LDQtNGA0LXRgSJ9LHsiYWRkcmVzcyI6IjNNSkFLbkViQmJrMk16RDQxN0ZnWG55V0FGZVk0UHlSZ3lQIiwidHlwZSI6ImNsaWVudCIsIm5hbWUiOiLQs9C-0LLQvdC-In0seyJhZGRyZXNzIjoiM01INnAybzl5Y3ZyNWlWYnpUUjZnVmVza3ZocU5jMmV5OEsiLCJ0eXBlIjoiY2xpZW50IiwibmFtZSI6ImRlY3J5cHQtc2VydmljZS0wIn0seyJhZGRyZXNzIjoiM01MenpHVjl5akpqM3dwQjltSEdZaG5tZUxubTVEUEVYODEiLCJ0eXBlIjoiY2xpZW50IiwibmFtZSI6ImRlY3J5cHQtc2VydmljZS0xIn0seyJhZGRyZXNzIjoiM01RN1ZuU2IycmREVU5zVnpVTXU1TUNzZ3VwOVBOenpwQWgiLCJ0eXBlIjoiY2xpZW50IiwibmFtZSI6ImRlY3J5cHQtMiJ9XSwicm9sZXMiOlsidXNlciJdLCJzdGF0dXMiOiJhY3RpdmUiLCJjcmVhdGVkQXQiOiIyMDIwLTA3LTE1VDExOjExOjA0LjczMVoiLCJpYXQiOjE1OTU1MDc3OTQsImV4cCI6MTU5NTUxMTM5NH0.pgpCkcYRvJKHPtpYOrXzV8nyhGI4cxpF67MGTIfjXDjaKYGpxNriLqcMo7owTLA5TuWZl8DaWH4hL_bJ0qzqOOp9CR4isaByw6N010nT9XLmLGTWsk8qE5XNm47SJ2rHETui1FmujQzZ3-C4KVHl3qBh2EFA7OcDDIQlCZLo4yBOBaDUzno6Wie_j-tmvAIw0UKFgqzCpeFeM4nkgLjXGzQvg4pohgLBZhOP_cWGRGnrzz5iOr7T5yvSQto2gndnnaj7Sk4ubbqbf0pTiZZSMO4K3sRM9LZeGZql-ciqJlOloFdk5Duh_O5jMTf6k8yCYVVi3St_FYIqJJHzklBkqqqOCTpyEqRJEU5UJMrSXf7n7OcKK9eZRS5sCyvbRH9FDi843utDJr-Nf-ZmBjUGzOFAFsvIaFU40J38xHvD1nsEZujDCqmZGDqVZJxijzbMMotkDkpTgEOMgE_BPqZ7GTLCCU17E93s7XZz0izkHxxxYRPwSZa7QD56BWpZwvjVe8g68EMwHZY19JOEROF8m53PzfnKt1reUICnfavft8hGf-nOseb2RLiljcYujETGw8kjKa0NAZI5quHCdFaOqUjUgWVe8XSInAkK80pjfZq25Kh-9L7dkbvEqzvYuhvecZc5_Ct-LCNmCpNRQb7e0_Fbs8y3OS9MV0Z7brYhZjU",
    refresh_token: ""
  },
  async refreshCallback(refreshToken) {
    const response = await nodeFetch(
      `http://blockchain.dev.gas20.ru/authServiceAddress/v1/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token: refreshToken
        })
      }
    );
    const responseJSON = await response.json();
    const { statusCode, status, error } = responseJSON;
    if (statusCode === 401 || status === 401) {
      throw new Error(error);
    }
    return responseJSON;
  },
  isResponseUnauthorized(response) {
    return response.status === 401;
  }
});

(async () => {

  // достаём байт сети из конфига ноды
  const { minimumFee, chainId } = await (await nodeFetch(`${NODE_ADDRESS}/node/config`)).json();

  const initialConfiguration = {
    ...MAINNET_CONFIG,
    nodeAddress: "http://blockchain.dev.gas20.ru/nodeAddress",
    crypto: 'gost',
    minimumSeedLength: 25,
    networkByte: chainId.charCodeAt(0),
  };

  // создаём api
  const Waves = create({
    initialConfiguration,
    fetchInstance: authorizedFetch
  });

  // бюллетень
  const votes = [[0, 1]]

  // Получение keyPair
  const { keyPair } = Waves.Seed.fromExistingPhrase(seedPhrase);
  // Получение параметров для шифрования
  const {
    base_point: basePoint, hash_length: hashLength, q
  } = await(await authorizedFetch(`${CRYPTO_SERVICE_ADDRESS}/v1/getParamSet`)).json();
  // получение mainKey
  const {value} = await (await authorizedFetch(`${NODE_ADDRESS}/contracts/${contractId}/MAIN_KEY`)).json();
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
    vote: JSON.stringify(encrypted),
    blindSig: 'signature'
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
    params: [
      { type: 'string', key: 'operation', value: 'vote' },
      ...Object.entries(contractParams).map(mapVoteParams)
    ],
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
    const result = await Waves.API.Node.transactions.rawBroadcast(signedTx);
    console.log('Success!')
    console.log(result)
  } catch (err) {
    console.log(`Error: ${err.data.error} Reason: ${err.data.message}`)
  }
})();
