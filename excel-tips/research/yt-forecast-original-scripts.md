# YouTube 原视频文案（预测工作表）· 字幕转写 + 拆解

抓取时间：2026-10-29 · 方式：ego 浏览器打开视频页 → 展开简介 → 打开「显示字幕」面板 → 切英语 → 抓取字幕（未播放视频）
字幕来源：YouTube 人工/自动字幕，标点为面板原文；`yt-script-*.json` 是逐段原始数据。

---

## 一、两支最相关的原视频

| 视频 | 频道 | 播放 | 时长 | 链接 |
|---|---|---|---|---|
| Forecasting in Excel with Seasonality (Forecast Sheet) | Leila Gharani | **99.0万** | 5:42 | https://www.youtube.com/watch?v=j22tLUQQDh4 |
| Forecasting in Excel: MUST-KNOW for Any Analyst | Kenji Explains | **28.7万** | 9:34 | https://www.youtube.com/watch?v=6rqhMnOgQnU |

简介原文（Leila）：

> Forecasting in Excel with seasonality: use the Forecast Sheet to turn past sales into a forecast with confidence bounds in a few clicks.
> The example uses Home Depot's quarterly sales from 2012 to 2021. You'll see why a straight trendline misses the seasonal peaks and valleys, how to create a forecast from Data → Forecast Sheet, and how to read the forecast line and its upper and lower confidence bounds. You'll also see how to start the forecast before your la[st data point]…

简介原文（Kenji）：

> Learn how to forecast accurately in Excel with functions and visuals.
> Forecasting is one of the most important skills you can learn as an analyst. An accurate forecast can help you save money, boost productivity, and even increase customer satisfaction… First, just a simple linear forecast with the function FORECAST.LINEAR. Then a forecast that also accounts for seasonality with FORECAST.ETS… Finally, we'll put it all together with the forecast sheet, where we'll create a visual alongside the upper and lower forecast ranges.

---

## 二、Leila（99 万）完整口播（按段落合并，原文）

**P1 开场：受众定位 → 常态痛点 → 承诺「点几下」→ 具体案例 → 起手**
If your profession is in finance or you're planning to work as a financial analyst, then creating forecasts and budgets is a constant exercise. Now, usually, this involves some form of predicting a future value based on existing historical values. So, it could be sales, manufacturing quantities, or other KPIs and trends. In today's video, I'm going to show you a great feature in Excel that can help you create these forecasts with just a few clicks. I'll be calculating a quick sales forecast for Home Depot. Sound good? Then let's get doing.

**P2 数据 + 先画折线图，讲清「为什么不能用线性趋势」**
Here's my data set. It's Home Depot's quarterly sales from 2012 to 2021. They have a fiscal year that ends on January 31st. I added the quarter numbers in column A just to make it easier for us. Now, our task is to create a sales forecast for the upcoming quarters. When you get a data set like this, it's a good idea to quickly plot this on a line chart just to get a better overview. So, let's highlight the date and the sales values, go to Insert and insert a line chart. Notice that there are lots of peaks and valleys, so there's definitely some seasonality involved. We can't really use some linear trend to predict the next quarters. We need a solution that takes the cyclicality of the historical data into consideration. So, this is where the Forecast Sheet in Excel comes into play. It's available from Excel 2016 onwards and this is how it works.

**P3 操作 + 读图（实线/预测线/上下界）**
First, highlight the historical values again, so I'm going to highlight the date and the sales columns. Then, go to Data, here on the Forecast section, click on Forecast Sheet. This plots our data on a line chart. Now, the blue line is our actual data and the orange lines here are the predictions. The middle one is the forecast and the thinner orange lines are the lower and the upper confidence bounds. So, if your confidence interval is 95%, then 95% of the future data points are going to fall between these two lines. With Forecast End, you can select a different end date for your forecast. You can just expand the options and adjust your selection. In the more options here, we get to decide when the forecast starts.

**P4 用「起点放在最后实际数据之前」检验准确度**
Now, I'm going to pick a date that's before the last actual data point. This way, I get a better idea of the forecasting accuracy because I can compare the forecast with the actual. So, I'm going to change this to January 31st, 2021. The confidence interval indicates the range that's likely to contain your estimates. So, the default value is 95% and I'm just going to go with that.

**P5 季节性：自动检测 vs 手动填周期**
For seasonality, you have a choice to let Excel detect it automatically or enter it yourself. So, by looking at the forecast in the chart, I can already see that it did pick up the seasonality in the data. So, we're going to leave it on automatic. If the algorithm wasn't able to establish a pattern, you're going to need to enter it manually. So, for instance, in my case, I would set it to four because for my data here one season consists of four quarters. But in this case, it works. I'm going to go back to detect automatically. Timeline and the values range is already picked up because I highlighted that range before I opened the Forecast Sheet. In case you need to make adjustments, you can do it manually here. I'm also going to leave Interpolation and Average as the default values.

**P6 创建之后：新表 + 图表 + 数据联动**
Now let's take a look at what happens when I click on Create. I'm going to get a new sheet inserted here with my historical values and my forecast values on the bottom. I also get the chart that we saw before. So, if I zoom out, we can see that the chart is inserted here, and it's referencing the series on this table. So, if you want, you can make adjustments to this data and it's going to automatically adjust your chart. Now, let's scroll down and see the forecast values that we got.

**P7 诚实复盘：拿已有实际值验证，承认「预测偏低」**
When we take a look at the values for the last two quarters, for which we actually had data for, we can see that the forecast came in too low. So, if I just move this out of the way, here's the lower bound, and this is the upper bound. So now, if I was going to predict the next two quarters, I'm probably going to consider a sales value that's between the forecast value and the upper confidence bound.

**P8 点开单元格：背后是 FORECAST.ETS 公式**
Now, when I click in the cell for forecast, we can see that Excel has automatically created these formulas with the FORECAST.ETS function. So, this function is used to predict future values by using an Exponential Triple Smoothing algorithm. So, without knowing much about statistics or function syntax, we were able to create the seasonal forecast.

**P9 条件与容错（"数据不完美也行"）**
So, as you can see, it's quite easy to create forecasts based on seasonal historical data. All you need is a timeline with data points that have consistent steps between them, and this can be months, it can be quarters, or years. And the data doesn't have to be perfect. The function can handle up to 30% of missing data, and it's going to automatically make adjustments for it.

**P10 收尾 + 温和 CTA**
I hope this is going to be helpful for you when you have to do your next forecast. Please give this video a thumbs up if you liked it, and do subscribe if you haven't already done so. Many thanks for watching and I'm going to see you in the next video.

### 结构拆解（5:42 里，真正花在「说服你继续看」上的只有前 40 秒）

| 段 | 作用 | 关键句式 |
|---|---|---|
| P1 | 受众定位（finance / financial analyst）→ 常态痛点 → 承诺「just a few clicks」→ 具体案例（Home Depot）→ 起手 | "If your profession is… then… is a constant exercise" |
| P2 | 先自己画折线图，用峰谷证明「有季节性，线性趋势不行」——为功能建立必要性 | "Notice that there are lots of peaks and valleys… We can't really use some linear trend" |
| P3 | 三步操作 + 读图（蓝=实际，橙=预测，细线=上下界） | "The middle one is the forecast…" |
| P4 | 参数：预测结束时间；把起点设在最后数据点之前来检验准确度 | "This way, I get a better idea of the forecasting accuracy" |
| P5 | 季节性自动/手动；时间轴和值域已自动带入；默认值都能用 | "If the algorithm wasn't able to establish a pattern…" |
| P6 | 创建后的结果：新表、图表、改数据图跟着变 | "if you want, you can make adjustments…" |
| P7 | 主动承认预测偏低，并讲怎么用上下界 | "the forecast came in too low" |
| P8 | 点开单元格看到 FORECAST.ETS——「不用懂统计也能做」 | "without knowing much about statistics…" |
| P9 | 使用条件 + 容错（间隔一致、可缺 30% 数据） | "the data doesn't have to be perfect" |
| P10 | 温和 CTA（点赞订阅），不喊口号 | "I hope this is going to be helpful" |

---

## 三、Kenji（28 万）开场（原文）

> If you work in any of these roles, forecasting is one of the most important skills you can learn. An accurate forecast can help you save money, boost productivity, and even increase customer satisfaction. So let me show you all the steps you need to create precise forecasts in Excel. First up, suppose that we work for a hotel group as analysts, and we've been given this data over here that has all of these dates on a quarterly basis, every 3 months, and we also have the sales on the side. With that, we want to try to find what our sales are going to be for these next 2 quarters…

他的方案结构（来自简介）：FORECAST.LINEAR（线性）→ FORECAST.ETS（带季节性）→ FORECAST.ETS.SEASONALITY（判断周期长度）→ FORECAST.ETS.CONFINT（置信区间 90/95/99%）→ 最后用预测工作表出可视化。开场是「受众 + 收益清单（省钱/提效/满意度）+ 角色扮演（酒店集团分析师）」。

---

## 四、跟我们 EP04 稿子的差别

| 维度 | YouTube 原视频 | 我们现在的稿子 |
|---|---|---|
| 开场 | 先**定位受众**（做财务/分析的人），再讲这件事是常态工作 | 先讲「年度预算里最花时间的是预测」（痛点），没定位受众 |
| 承诺 | 明确「a few clicks」——把成本说低 | 「没有公式」——只说了一个点 |
| 建立必要性 | 先画折线图，让观众看到峰谷，**自己得出结论**「线性趋势不行」 | 直接跳到功能，省略了「为什么需要它」 |
| 案例 | 具体公司 + 具体期间（Home Depot 2012–2021 季度） | 只有「24 个月数据」，没有具体业务 |
| 诚实度 | 主动承认预测偏低、讲上下界怎么用 | 已有「只能作参考」，方向一致 |
| 条件 | 「时间轴间隔一致」「可缺 30% 数据」 | 已讲「日期固定间隔」，缺「容错」 |
| CTA | 温和（点赞订阅） | 陈述句收尾（更克制） |

**可借鉴的三条**（不违背客观专业）：
1. 开场把「谁需要看」说清楚：「只要工作需要预测下个季度/下一年的数」——比抽象痛点更容易让人对号入座。
2. 承诺具体化：「选两列、点几下」比「不用公式」更有画面。
3. 用「先看折线图 → 发现峰谷 → 所以需要」的顺序建立必要性；40 秒版可以压缩成一句：「如果数据有季节性，拉一条直线是预测不准的。」

---

## 五、原始数据文件

- `excel-tips/research/yt-script-j22tLUQQDh4-en.json`（Leila 英文字幕，逐段）
- `excel-tips/research/yt-script-6rqhMnOgQnU.json`（Kenji 自动字幕，逐段，按词切分）
- `excel-tips/research/yt-forecast-ref.json`（视频元数据 + 简介）
- 字幕面板默认语言被记忆成了阿拉伯语；切换路径：展开简介 → 显示字幕 → 右上语言下拉 → 英语。
