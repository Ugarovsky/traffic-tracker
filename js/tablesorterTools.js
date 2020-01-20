var tableLength = 0
var resultRows = []
var reasons = [
  'none',
  'ads_integrity_policy',
  'ads_ip_review',
  'risk_payment',
  'gray_account_shut_down',
  'ads_afc_review',
  'business_integrity_rar',
  'permanent_close',
  'unused_reseller_account',
  'unused_account'
]

var colors = {
  '#ffb4b4': ['error', 'disable', 'disapproved'],
  '#fff3b4': ['paused'],
  '#ddffb4': ['active'],
  '#b4ffff': ['pending_review']
}

var pushRow = (account, adAccount, ad) => {
  statuts = [account.status]
  if (adAccount) {
    statuts.splice(1, 0, adAccount.status)
  }
  if (ad) {
    statuts.splice(3, 0, ad.campStatus.replace('adset_', '').replace('campaign_', ''), ad.adsetStatus.replace('adset_', '').replace('campaign_', ''), ad.status.replace('adset_', '').replace('campaign_', ''))
  } else {
    statuts.splice(3, 0, '', '', '')
  }

  for (let i in statuts) {
    for (let color in colors) {
      if (colors[color].indexOf(statuts[i]) !== -1) {
        statuts[i] = '<span style="background: ' + color + ';">' + statuts[i] + '</span>'
      }
    }
  }

  allstatus = statuts.join(' ')

  let columns = [
    allstatus,
    account.status,
    '<span title="' + account.token + '">' + account.token.substr(-6) + '</span>',
    account.id,
    account.name,
    account.group
  ]
  if (adAccount) {
    columns.splice(columns.length, 0, 
      adAccount.status,
      reasons[parseInt(adAccount.reason)],
      adAccount.limit,
      adAccount.nextBill + '$',
      adAccount.unbilled + '$',
      adAccount.currency,
      adAccount.BMName,
      adAccount.BMId,
      adAccount.name,
      adAccount.id.substr(-5),
      adAccount.card
    )
  } else {
    columns.splice(columns.length, 0, 
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    )
  }
  if (ad) {
    columns.splice(columns.length, 0, 
      ad.campName,
      ad.campId.substr(-5),
      ad.campStatus.replace('adset_', '').replace('campaign_', ''),
      (ad.campBudget || 0) + '$',
      ad.adsetName,
      ad.adsetId.substr(-5),
      ad.adsetStatus.replace('adset_', '').replace('campaign_', ''),
      (ad.adsetBudget || 0) + '$',
      ad.name,
      ad.id.substr(-5),
      ad.status.replace('adset_', '').replace('campaign_', ''),
      '<img src="' + ad.pic + '" style="width: 48px;">',
      ad.imp,
      parseFloat(ad.cpm).toFixed(2) + '$',
      ad.clicks,
      parseFloat(ad.cpc).toFixed(2) + '$',
      parseFloat(ad.ctr).toFixed(2),
      ad.lead,
      parseFloat(ad.cpl).toFixed(2),
      parseFloat(ad.spend).toFixed(2) + '$',
      parseFloat(ad.rev).toFixed(2) + '$',
      ad.roi,
      '<a href="' + ad.console_link + '" target="_blank">ссылка</a>'
    )
  } else {
    columns.splice(columns.length, 0, 
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      0,
      '',
      0,
      '',
      '',
      0,
      '',
      0,
      '',
      '',
      //'<a href="' + ad.console_link + '">ссылка</a>'
      ''
    )
  }
  for (let clm in columns) {
    for (let color in colors) {
      if (colors[color].indexOf(columns[clm]) !== -1) {
        columns[clm] = '<span style="background: ' + color + ';">' + columns[clm] + '</span>'
      }
    }
  }
  let r = []
  let row = '<tr>'
  columns.unshift(++tableLength)
  for (let column of columns) {
    row += '<td>' + column + '</td>'
    r.push(column)
  }
  resultRows.push(r.join(' | '))
  row += '</tr>'
  let $row = $(row)
  let resort = true
  $('table')
    .find('tbody').append($row)
    .trigger('addRows', [$row, resort]);
}

var clearData = async () => {
  resultRows = []
  tableLength = 0
  $table = $('table')
  $.tablesorter.clearTableBody( $table[0] );
  $table.trigger('update')
  return (true)
}