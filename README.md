## Levels Health (unofficial)

Unofficial JS API for [Levels Health](https://www.levelshealth.com/), mined using Charles proxy.

This API is not associated with Levels Health and you shouldn't bother them if this breaks due to their own API changes.

### Installation

```
npm install --save levels-health-unofficial
```

```
yarn install levels-health-unofficial
```

### Usage

```
const LevelsHealth = require('levels-health-unofficial')

// Class was used to hold `token` and constructors can't be async`
const levels = new LevelsHealth()

const email = 'email@email.com'
const password = 'hunter2!'

// No need to save this, just useful if you want it. Their login method is AWS Cognito so
// this method could be handy utility when the API is expanded and this lib isn't update.
const jwtToken = await levels.login(email, password)

const beginQuery = dayjs().subtract(7, 'days').startOf()
const endQuery = dayjs.add(1, 'days').startOf()

const glucoseHistory = await levels.glucoseHistory(beginQuery, endQuery)

const {
  glucoseMetrics,
} = glucoseHistory

glucoseMetrics.values.forEach(console.log)
```

### API

#### userData()
Fetch data of your account, pretty basic info

#### requestSensorRefresh()
Request that Levels re-fetch sensor data. Already automated so don't call this constantly.

#### findZones()
Fetch daily stats of glucose high-low and scores

Returns Promise<Object> of scores & glucose ranges

#### getSensorStatus()
Fetch status of current Libre sensor

#### metabolicFitnessStreaks(start, end)
Fetch metabolic fitness streaks

@param {Number} start Range start, time since unix epoch in milliseconds
@param {Number} end Range end, time since unix epoch in milliseconds

Returns Promise<Object> of streaks of good glucose scores

#### heartRateMetrics(start, end)
Fetch heart rate metrics, presumably pulled from Apple Health

@param {Number} start Range start, time since unix epoch in milliseconds
@param {Number} end Range end, time since unix epoch in milliseconds

Returns Promise<Object> of heart rate metrics

#### metabolicFitness(start, end)
Fetch daily metabolic fitness score

@param {Number} start Range start, time since unix epoch in milliseconds
@param {Number} end Range end, time since unix epoch in milliseconds

Returns Promise<Object> of daily overall metabolic fitness score

#### getInsightFeed(start, end)
Fetch insight / news feed

@param {Number} start Range start, time since unix epoch in milliseconds
@param {Number} end Range end, time since unix epoch in milliseconds

Returns Promise<Object> of insights / news feeds

#### glucoseHistory(start, end)
Fetch raw glucose scores of range

@param {Number} start Range start, time since unix epoch in milliseconds
@param {Number} end Range end, time since unix epoch in milliseconds

Returns Promise<Object> of raw glucose scores along with stats
