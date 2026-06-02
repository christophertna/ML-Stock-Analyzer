# ml/predict.py — Linear Regression ML Model

import sys
import json
import warnings
warnings.filterwarnings('ignore')

import yfinance as yf # stock data from Yahoo Finance
import pandas as pd # data manipulation (DataFrames, basically Excel tables for Python)
# Each column is a "Series" 

import numpy as np # numerical operations
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split



# Get the ticker symbol passed from Node.js
ticker = sys.argv[1] if len(sys.argv) > 1 else 'AAPL' # default value APPL
# sys.argv is a list: [script_name, arg1, arg2, ...]
# sys.argv[1] is the first argument — which Node passes as the ticker


# Download 6 months of stock data using yfinance
stock = yf.Ticker(ticker)
df = stock.history(period='6mo')
# yfinance fetches OHLCV data: 'Open, High, Low, Close, Volume' 


# Case where no data is returned
if df.empty: print(json.dumps({"error": "..."})); sys.exit(1)


# "Features" are the inputs fed to the model in a ML context
# Raw price data alone is weak, but derived features (moving averages, momentum, volatility) 
# give model more to learn from


# Features to add:

# A 5-day MA is the average close over the last 5 days
# When MA5 crosses above MA20 --> "golden cross" in trading
df['MA5'] = df['Close'].rolling(window=5).mean()
df['MA20'] = df['Close'].rolling(window=20).mean()

# In simple terms:
# When MA5 crosses above MA20 → bullish 
# When MA5 crosses below MA20 → bearish 


# Daily Return: percentage change from previous day
df['Return'] = df['Close'].pct_change()
# pct_change(): (today - yesterday) / yesterday


# Volatility: rolling standard deviation of returns for a week (Mon-Fri)

# Volatility Calculation:
# 1- Calculate daily returns for last 5 days
# 2- Find average return for last 5 days
# 3- Calculate how far each return is from the average
# 4- Standard Devidation (std)    
df['Volatility'] = df['Return'].rolling(window=5).std()

# How much the price swings around from day to day:
# High volatility = wild/active price swings
# Low volatility = stable/dead moves


# Lagged Prices: previous days' closing prices
df['Lag1'] = df['Close'].shift(1) # yesterday's close
df['Lag2'] = df['Close'].shift(2) # close from 2 days ago
df['Lag3'] = df['Close'].shift(3) # close from 3 days ago
# shift(n) moves values down by n rows, creating the "lag"


# Volume Moving Average: smoothed volume trend for a week

# Average number of shares traded per day over the last 5 days
# Calculation: Same as MA5, but with volume instead of price
df['Volume_MA5'] = df['Volume'].rolling(window=5).mean()


# Drop rows with NaN values created by operations
df = df.dropna()
# rolling() and shift() create NaN values at the start of the series 
# where there is not enough history yet (depending on the window size)


# Supervised Learning in ML:
# X = input features (what model learns FROM, the training data)
# y = target variable (what model learns TO predict)

# Feature columns and split X & y
feature_cols = ['MA5', 'MA20', 'Return', 'Volatility',
                'Lag1', 'Lag2', 'Lag3', 'Volume_MA5']


# The model learns a mapping function: f(X) approximately equals y
X = df[feature_cols]
y = df['Close']


# NEVER evaluate a model on data it trained on:
# Same practice/training questions on the actual test!
# Then no proof if model actually learned and if it can be applied to future/new situations


# For this project, split the data: Test set 20% & Training set 80%

# Ex: Original data of 100 trading days (chronological order):
# Day 1, Day 2, Day 3 ... Day 98, Day 99, Day 100

# After train_test_split with shuffle=False:
# TRAINING SET (80 days):    Day 1 through Day 80
# TEST SET (20 days):        Day 81 through Day 100

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, shuffle=False
) 
# shuffle=False for time-series data since:
# If shuffle is true, future data leaks into training (data leakage)

# Ex: Original order:   Jan, Feb, Mar, Apr, May, Jun
#     After shuffle:    Mar, Jan, May, Feb, Jun, Apr, which makes 0 sense for stock price prediction

# Stocks needs to keep their date order structure, or their 'temporal dependencies' (today relates to yesterday)


# Each feature gets a learned "weight" (coefficient):
# - A positive weight means that feature pushes the price prediction up
# - A negative weight means it pushes the prediction down

# Create and train the model:

model = LinearRegression()
# LinearRegression finds the best-fit hyperplane
# through the data by minimizing squared errors (Ordinary Least Squares)

model.fit(X_train, y_train)
# .fit() is the learning phase (LinearRegression finding the best-fit hyperplane)
# After this, model.coef_ holds the learned weight for each feature


# Now for regression metrics:

# Generate predictions on the test set (training data) and calculate metrics
y_pred = model.predict(X_test)

# MAE (Mean Absolute Error)
mae = mean_absolute_error(y_test, y_pred)
# The average dollar amount the prediction is off by ...$
# Lower is better and easier to interpret: "off by $X on average"

# R-squared
r2 = r2_score(y_test, y_pred)
# How much of the price variance the model explains
# Ex: Range is 0.0 to 1.0, and a score of 0.75 means 75% is explained
# High R2 value on stock data can mean overfitting (skeptical)


# Actual price prediction happens now

# Use the most recent row of features to predict the next price (most recent completeled trading day)
# Depends on WHEN you run the program
last_features = X.iloc[[-1]]

# make the prediction
predicted_price = model.predict(last_features)[0] # [0] extracts the number value from the list/array


# Last 60 days of prices and dates for the chart
historical_prices = df['Close'].tail(60).tolist()
historical_dates = [str(d.date()) for d in df.index.tolist()][-60:]


# Build and print the result dictionary as a JSON string
result = {
    "ticker": ticker,
    "predicted_price": round(predicted_price, 2),
    "current_price": round(float(df['Close'].iloc[-1]), 2),
    "mae": round(float(mae), 4),
    "r2": round(float(r2), 4),
    "historical_prices": historical_prices,
    "historical_dates": historical_dates,
    "feature_weights": dict(zip(feature_cols, model.coef_.tolist()))
}
print(json.dumps(result))
# json.dumps() converts the Python dict to a JSON string

# Areas to improve in the future or new features to possibly include:
# -confidence intervals (ex: 95% sure price will be between 174$ & 179$)
# -probabilities (ex: 65% chance price increases)
# -prediction ranges (ex: Best case price is 182$, Worst case price is 171$)


# can test this file directly by running "python ml/predict.py AAPL " in the terminal
# and should return a JSON object with all the details and feature values for ticker 'AAPL'
