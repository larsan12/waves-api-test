const { create } = require('@vostokplatform/waves-api');
const nodeFetch = require('node-fetch');

/*  Базовый пример вызова контракта  */

// CONFIG:
// адресс ноды
const NODE_ADDRESS = 'https://obama.vostokservices.com/nodeAddress';

// id контракта, то есть для начала нужно создать контракт на основе доступных образов
// как создать контракт - сделаем отдельный example
const contractId = 'FV9hupg7b2fMBGAaS4LXbes5NFJUswViWcdYKAXCujWo'

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

    // достаём байт сети из конфига ноды и комиссию
    const { chainId, minimumFee } = await (await fetch(`${NODE_ADDRESS}/node/config`)).json();

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

    // создаем сида из фразы
    const seed = Waves.Seed.fromExistingPhrase(seedPhrase);

    const data = {
      senderPublicKey: seed.keyPair.publicKey,
      authorPublicKey: seed.keyPair.publicKey,
      contractId,
      // версия контракта - обычно 1, если не меняли контракт
      contractVersion: 1,
      timestamp: Date.now(),
      // параметры вызовов контракта, для голования будет например инфа - за кого проголосовали
      // для параметров и вызова контракта голосования сделаем отдельный example
      params: [],
      // фиксированная комиссия из конфига ноды
      fee: minimumFee[104]
    };


    // методы waves-api
    try {
      // метод waves-api на подписание транзакции вызова контракта
      const signedTx = await Waves.API.Node.transactions.sign('dockerCallV2', data, seed.keyPair);
      // подписанную транзакцию отправлять на ноду в эндпоинт /transactions/broadcast
      console.log('Signed tx: ')
      console.log(signedTx)

      // метод waves-api на вызов контракта - сразу подписывает и отправляет транзакцию
      const result = await Waves.API.Node.transactions.broadcastFromClientAddress('dockerCallV2', data, seed.keyPair);
      console.log('Success!')
      console.log(result)
    } catch (err) {
      console.log(`Error: ${err.data.error} Reason: ${err.data.message}`)
    }

})();
