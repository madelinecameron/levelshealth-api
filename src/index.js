const Cognito = require('amazon-cognito-identity-js')
const fetch = require('node-fetch')
const dayjs = require('dayjs')

const GRAPH_QUERIES = {
  getUserData: {"variables": {},"query": "{\n  me {\n    id\n    firstName\n    lastName\n    experiments\n    email\n    userValues(keys: [\"current_timezone\", \"beta\", \"latest_glucose_timestamp\"])\n    referralCode {\n      code\n      url\n      __typename\n    }\n    __typename\n  }\n}\n"
  },
  metabolicFitnessStreaks: {"variables":{},"query":"{\n  metabolicFitnessStreaks {\n    streaks\n    __typename\n  }\n}\n"},  heartRateMetrics: {"variables":{"range":[]},"query":"query ($range: TimestampRange!) {\n  heartRateMetrics(input: {range: $range}) {\n    id\n    values {\n      time\n      value\n      __typename\n    }\n    __typename\n  }\n}\n"},
  sleepLogs: {"operationName":"SleepLogs","variables":{"range":[]},"query":"query SleepLogs($range: TimestampRange!) {\n  sleepLogs(input: {range: $range}) {\n    values {\n      id\n      type\n      title\n      timestamp\n      endTimestamp\n      note\n      __typename\n    }\n    __typename\n  }\n}\n"},
  requestSensorRefresh: {"variables":{"priority":"user_app_focus"},"query":"mutation ($priority: String!) {\n  refreshSensorDataWithStatus(input: {priority: $priority}) {\n    recordsImported\n    mostRecentValue\n    error\n    errorWhileRefreshing\n    nextAllowedScrape\n    __typename\n  }\n}\n"},
  findZones: {"operationName":"GetZonesFromActivityCatalogue","variables":{"sortOrder":"SCORE_DESC","types":["FOOD","EXERCISE","NOTE"],"scoreGreaterThan":0,"scoreLessThan":10,"offset":0,"limit":20},"query":"query GetZonesFromActivityCatalogue($keyword: String, $types: [HealthLogType!], $sortOrder: ZoneSortOptions!, $scoreGreaterThan: Int, $scoreLessThan: Int, $offset: Int, $limit: Int) {\n  findZones(input: {keyword: $keyword, types: $types, sortOrder: $sortOrder, scoreGreaterThan: $scoreGreaterThan, scoreLessThan: $scoreLessThan, offset: $offset, limit: $limit}) {\n    id\n    range\n    stats {\n      score\n      avg\n      glucoseDelta\n      timeAboveRange\n      peak\n      mayUpdate\n      hideScore\n      __typename\n    }\n    entries {\n      id\n      type\n      title\n      note\n      state\n      imageKey\n      timestamp\n      endTimestamp\n      payload {\n        isStrenuous\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n"},
  getSensorStatus: {"operationName":"GetSensorStatus","variables":{},"query":"query GetSensorStatus {\n  sensorStatus {\n    isConnected\n    vendor\n    lastKnownData\n    lastScrapeAttempt\n    nextScheduledScrape\n    mostRecentValue\n    __typename\n  }\n}\n"},
  mfsDaily: {"operationName":"mfsDaily","variables":{"range":[],"sortOrder":"TIME_DESC"},"query":"query mfsDaily($range: TimestampRange!, $sortOrder: DailyMFSSortOptions!) {\n  dailyMetabolicFitnessScore(input: {range: $range, sortOrder: $sortOrder}) {\n    time\n    value\n    __typename\n  }\n}\n"},
  getInsights: {"operationName":"GetInsightCardsFromDashboard","variables":{"range":[]},"query":"query GetInsightCardsFromDashboard($range: TimestampRange!) {\n  getUserFeed(input: {range: $range}) {\n    id\n    identifier\n    activeAt\n    content {\n      title\n      description\n      dismissible\n      link\n      image\n      header\n      buttonText\n      buttonLink\n      __typename\n    }\n    shouldSolicitFeedback\n    __typename\n  }\n}\n"},
  glucoseHistory: {"operationName":"GlucoseMetricsHistory","variables":{"range":[],"prevStatRange":[]},"query":"query GlucoseMetricsHistory($range: TimestampRange!, $prevStatRange: TimestampRange) {\n  glucoseMetrics(input: {range: $range, prevStatRange: $prevStatRange}) {\n    id\n    values {\n      time\n      value\n      __typename\n    }\n    stats {\n      score\n      avg\n      avgPercent\n      __typename\n    }\n    prevStats {\n      score\n      avg\n      avgPercent\n      __typename\n    }\n    glucoseAnomalies {\n      id\n      type\n      startTime\n      __typename\n    }\n    zones {\n      id\n      range\n      stats {\n        score\n        avg\n        glucoseDelta\n        timeAboveRange\n        peak\n        mayUpdate\n        hideScore\n        __typename\n      }\n      entries {\n        id\n        type\n        note\n        title\n        state\n        userId\n        timestamp\n        endTimestamp\n        payload {\n          isStrenuous\n          __typename\n        }\n        imageKey\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n"}
}

const $executeQuery = Symbol('executeQuery')

class Levels {
  constructor() {}

  async login(email, password) {
    const levelsCognitoPool = {
      UserPoolId: 'us-east-2_HrbIXNNBD',
      ClientId: '7h2gfvbt69fhijvvn0vfn10ih2',
    }

    const userPool = new Cognito.CognitoUserPool(levelsCognitoPool)

    const authDetails = new Cognito.AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new Cognito.CognitoUser({
      Username: email,
      Pool: userPool,
    })

    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (result) => {
          const token = result.getAccessToken().getJwtToken()

          this.token = token

          return resolve(token)
        },
        onFailure: reject,
      })
    })
  }

  async [$executeQuery](query, range) {
    if (query.variables && query.variables.range) {
      let start = range && range.start
      let end = range && range.end

      if (!start || !end) {
        // Use the app standard one day range
        start = start || dayjs().subtract(1, 'days').startOf('day').toDate(),
        end = end || dayjs().add(1, 'days').startOf('day').toDate()
      }

      query.variables.range = [ start, end ]
    }

    const res = await fetch('https://app.levelshealth.com/api/graphql', {
      method: 'POST',
      body: JSON.stringify(query),
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    })

    return res.json()
  }

  async metabolicFitness(start, end) {
    return this[$executeQuery](GRAPH_QUERIES.mfsDaily)
  }
}

module.exports = Levels
