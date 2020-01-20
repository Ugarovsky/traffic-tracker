var token = 'yNeJ5OOsOtq2rmUTIrhHVsQkFAhsn-xb'
var sync = true

let date = (new Date())
let tdate = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).substr(-2) + '-' + ('0' + date.getDate()).substr(-2)
//var selectDate = tdate + '+-+' + tdate
var selectDates = [
  tdate,
  tdate
]

var dataJson = []

var tmads = 0

var setStatus = (status) => {
  $('#appStatus').text(status)
  console.log('#', status)
}

var apiQuery = async (method, params = {}) => {
  params.key = token

  dates = false

  if (method == 'get-statistics') {
    dates = selectDates.join('+-+')
  }

  let searchParams = (new URLSearchParams(params)).toString()

  let rawResp = await fetch(API_HOST + method + '?' + (dates !== false ? 'dates=' + dates + '&' : '') + searchParams, {
    method: 'GET'
  })
  
  let resp = await rawResp.json()
  let error = false
  if ((typeof(resp.success) !== 'undefined') && (resp.success == false)) {
    console.error('ERROR!!! ' + resp.message)
    alert('ERROR!!! ' + resp.message)
    error = true
  }

  return (!error ? resp : false)
}

var parseSocAccounts = async () => {
  setStatus('получаем социальные аккаунты')
  let l = 'парсим социальные аккаунты: '
  let accounts = await apiQuery('get-accounts')
  if (!accounts) {
    console.warn('parseSocAccounts error')
    return (false)
  }

  for (let i in accounts) {
    if (i !== 'requestsLeft') {
      let rAccount = accounts[i]
      if (typeof(rAccount) == 'object') {
        let account = {
          id: rAccount.id,
          name: rAccount.name,
          status: (rAccount.status == 1 ? 'active' : 'error'),
          token: rAccount.access_token,
          group: rAccount.group_name,
          adAcs: []
        }

        let ii = dataJson.push(account) - 1

        setStatus(l + account.name)

        if (!sync) {
          parseAdAccounts(account)
        }
      }
    }
  }
  setStatus('получили все социальные аккаунты')
  return (true)
}

var parseAdAccounts = async (account) => {
  setStatus('получаем рекламные аккаунты (' + account.name + ')')
  let l = 'парсим рекламные аккаунты: '
  let adAccounts = await apiQuery('get-adaccounts', { account: account.id })
  if (!adAccounts) {
    console.warn('parseAdAccounts error')
    return (false)
  }
  if (adAccounts.error) {
    $('#log')[0].value += 'account: ' + account.id + ' (' + account.name + '): '+ adAccounts.error.message + '\n'
    console.warn('account: ' + account.id + ' (' + account.name + '): '+ adAccounts.error.message)
    if (!sync) {
      pushRow(account, null, null)
    }
  } else {
    if (adAccounts.data.length == 0) {
      if (!sync) {
        pushRow(account, null, null)
      }
    } else {
      for (let rAdAccount of adAccounts.data) {
        let adAccount = {
          name: rAdAccount.name,
          status: ((rAdAccount.account_status == 1)
            ? 'active'
            : 'disable'
          ),
          limit: rAdAccount.adtrust_dsl,
          reason: rAdAccount.disable_reason,
          nextBill: ((rAdAccount.adspaymentcycle) && (rAdAccount.adspaymentcycle.data[0])
            ? (rAdAccount.adspaymentcycle.data[0].threshold_amount / 100)
            : 'null'
          ),
          unbilled: ((rAdAccount.current_unbilled_spend)
            ? (rAdAccount.current_unbilled_spend.offsetted_amount / 100)
            : 'null'
          ),
          currency: rAdAccount.currency,
          BMName: ((rAdAccount.business)
            ? rAdAccount.business.name
            : 'null'
          ),
          BMId: ((rAdAccount.business)
            ? rAdAccount.business.id.toString().substr(-4)
            : 'null'
          ),
          id: rAdAccount.account_id,
          card: ((rAdAccount.funding_source_details || false) && (rAdAccount.funding_source_details.display_string || false)
            ? rAdAccount.funding_source_details.display_string.substr(-5)
            : 'null'
          ),
          ads: []
        }
        account.adAcs.push(adAccount)
        setStatus(l + adAccount.name + ' (' + account.name + ')')
        if (!sync) {
          parseAds(account, adAccount)
        }
      }
    }
  }
  setStatus('получили рекламные аккаунты')
  return (true)
}

var runParserAdAccounts = async () => {
  for (let account of dataJson) {
    await parseAdAccounts(account)
  }
  setStatus('получили все рекламные аккаунты')
  return (true)
}

var parseAds = async (account, adAccount) => {
  setStatus('получаем объявления (' + account.name + ', ' + adAccount.name + ')')
  let l = 'парсим объявления (' + account.name + ', ' + adAccount.name + '): '
  let params = {
    account: account.id,
    mode: 'ads',
    status: 'all',
    ad_account: adAccount.id
  }

  let adsets = {}
  let campaigns = {}

  params.mode = 'adsets'
  setStatus(l + params.mode)
  let rAdsets = await apiQuery('get-statistics', params)

  if ((rAdsets.data) && (rAdsets.data[0]) && (rAdsets.data[0].adsets)) {
    for (let rAdset of rAdsets.data[0].adsets.data) {
      adsets[rAdset.id] = {
        status: rAdset.effective_status.toLowerCase(),
        budget: parseInt(rAdset.daily_budget) / 100
      }
    }
  }

  params.mode = 'campaigns'
  setStatus(l + params.mode)
  let rCampaigns = await apiQuery('get-statistics', params)

  if ((rCampaigns.data) && (rCampaigns.data[0]) && (rCampaigns.data[0].campaigns)) {
    for (let rCampaign of rCampaigns.data[0].campaigns.data) {
      campaigns[rCampaign.id] = {
        status: rCampaign.effective_status.toLowerCase(),
        budget: parseInt(rCampaign.daily_budget) / 100
      }
    }
  }

  params.mode = 'ads'
  let ads = await apiQuery('get-statistics', params)

  if (!((ads.data) && (ads.data[0]) && (ads.data[0].ads))) {
    $('#log')[0].value += 'account ' + account.id + ' (' + account.name + ') adAccount '+ adAccount.id + '(' + adAccount.name + ') не имеет рекламных объявлений' + '\n'
    console.warn(account.id, account.name, adAccount.id, adAccount.name, 'no ads')

    if (!sync) {
      pushRow(account, adAccount, null)
    }

    return (false)
  }

  if (ads.data[0].ads.data.length == 0) {
    if (!sync) {
      pushRow(account, adAccount, null)
    }
  }

  tmads += ads.data[0].ads.data.length

  console_link = 'https://fbtool.pro/console?id=' + account.id + '&ad_account_id=' + ads.data[0].id

  for (let rAd of ads.data[0].ads.data) {
    let ad = {
      name: rAd.name,
      id: rAd.id,
      status: rAd.effective_status.toLowerCase(),
      pic: rAd.creative.thumbnail_url,
      imp: rAd.insights.data[0].impressions,
      cpm: (rAd.insights.data[0].cpm || 0),
      ctr: (rAd.insights.data[0].ctr || 0),
      clicks: rAd.insights.data[0].clicks,
      cpc: (rAd.insights.data[0].cost_per_unique_click || 0),
      lead: 0,
      spend: rAd.insights.data[0].spend,
      rev: 0,
      roi: 0,

      campName: rAd.campaign.name,
      campId: rAd.campaign.id,
      campStatus: (campaigns[rAd.campaign.id] || {status: 'disable'}).status,
      campBudget: (campaigns[rAd.campaign.id] || {budget: '0'}).budget,

      adsetId: rAd.adset.id,
      adsetName: rAd.adset.name,
      adsetStatus: (adsets[rAd.adset.id] || {status: 'disable'}).status,
      adsetBudget: (adsets[rAd.adset.id] || {budget: '0'}).budget
    }

    try {
      ad.lead = rAd.insights.data[0].results[0].values[0].value
    } catch (e) {
      // pass
    }

    if (rAd.insights.data[0].actions) {
      for (let action of rAd.insights.data[0].actions) {
        if (action.action_type == 'link_click') {
          ad.clicks = action.value
        }
      }
    }

    ad.ctr = parseFloat(parseInt(ad.clicks) / parseFloat(ad.imp) * 100) || 0
    ad.cpl = parseFloat(parseFloat(ad.spend) / parseInt(ad.lead)) || 0
    ad.console_link = console_link

    adAccount.ads.push(ad)

    setStatus(l + ad.name)

    tmads -= 1

    if (!sync) {
      if (tmads <= 0) {
        setStatus('обновлено')
      }
      pushRow(account, adAccount, ad)
    }
  }
  return (true)
}

var runParserAds = async () => {
  for (let account of dataJson) {
    for (let adAccount of account.adAcs) {
      if (sync) {
        await parseAds(account, adAccount)
      } else {
        parseAds(account, adAccount)
      }
    }
  }
  if (sync) {
    setStatus('получили все рекламные объявления')
  }
}

var generateTable = async () => {
  setStatus('генерируем таблицу')
  for (let account of dataJson) {
    if (account.adAcs.length == 0) {
      pushRow(account, null, null)
    } else {
      for (let adAccount of account.adAcs) {
        if (adAccount.ads.length == 0) {
          pushRow(account, adAccount, null)
        } else {
          for (let ad of adAccount.ads) {
            pushRow(account, adAccount, ad)
          }
        }
      }
    }
  }
}

var startParse = async () => {
  await parseSocAccounts()
  if (sync) {
    await runParserAdAccounts()
    await runParserAds()
    await generateTable()
    setStatus('готово')
  }
}

var pushNullRows = async () => {
  for (let account of dataJson) {
    if (account.adAcs.length == 0) {
      pushRow(account, null, null)
    } else {
      for (let adAccount of account.adAcs) {
        if (adAccount.ads.length == 0) {
          pushRow(account, adAccount, null)
        }
      }
    }
  }
}

var clearAds = async () => {
  for (let account in dataJson) {
    for (let adAccount in dataJson[account].adAcs) {
      dataJson[account].adAcs[adAccount].ads = []
    }
  }
}

var updateDate = async () => {
  setStatus('обновление')
  sync = true
  let dateTo = $('#dateTo')[0].value
  let dateFrom = $('#dateFrom')[0].value
  let date = (new Date())
  let tdate = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).substr(-2) + '-' + ('0' + date.getDate()).substr(-2)
  if (dateTo == '') {
    dateTo = tdate
  }
  if (dateFrom == '') {
    dateFrom = tdate
  }
  selectDates = [
    dateFrom,
    dateTo
  ]
  //nSelectDate = dateFrom + '+-+' + dateTo
  /*if (nSelectDate == selectDate) {
    setStatus('обновлено')
  }*/
  //selectDate = nSelectDate
  await clearData()
  await clearAds()
  await runParserAds()
  if (sync) {
    await generateTable()
  } else {
    await pushNullRows()
  }
  setStatus('обновлено')
}

var showResultJson = () => {
  let popapel = $('#popap')
  let resultel = $('#resultJson')[0]
  resultel.value = resultRows.join('\n')
  popapel.css('display', 'block')
}

var closeResultJson = () => {
  let popapel = $('#popap')
  popapel.css('display', 'none')
}