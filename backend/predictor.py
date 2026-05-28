"""
客流预测服务 - XGBoost + 时间特征工程
等效 Prophet 的季节性能力，更轻量
"""

import sqlite3, json, os
from datetime import date, timedelta
import numpy as np
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBRegressor

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'flow_warning.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def build_features(dates: list, store_id: str = None) -> np.ndarray:
    """构建时间特征矩阵（替代 Prophet）"""
    n = len(dates)
    X = np.zeros((n, 10))
    for i, d in enumerate(dates):
        dt = date.fromisoformat(d) if isinstance(d, str) else d
        X[i, 0] = i                              # trend (线性趋势)
        X[i, 1] = dt.weekday()                   # 星期几 0-6
        X[i, 2] = 1 if dt.weekday() >= 5 else 0 # 是否周末
        X[i, 3] = dt.month                       # 月份 1-12
        X[i, 4] = np.sin(2 * np.pi * i / 7)      # 周周期 sin
        X[i, 5] = np.cos(2 * np.pi * i / 7)      # 周周期 cos
        X[i, 6] = np.sin(2 * np.pi * dt.timetuple().tm_yday / 365)  # 年周期 sin
        X[i, 7] = np.cos(2 * np.pi * dt.timetuple().tm_yday / 365)  # 年周期 cos
        X[i, 8] = 1 if dt.day <= 7 else 0        # 月初
        X[i, 9] = 1 if dt.day >= 25 else 0       # 月末
    return X

def predict_flow(store_id: str = None, horizon: int = 7, lookback: int = 60):
    """
    预测门店/全局客流
    返回: { dates, passerby_pred, passerby_lower, passerby_upper,
            enter_pred, enter_lower, enter_upper, metrics }
    """
    conn = get_db()
    today = date.today()
    end = today - timedelta(days=1)  # 预测从昨天开始
    start = end - timedelta(days=lookback)

    # 查询历史数据
    if store_id:
        rows = conn.execute("""
            SELECT data_date, SUM(pass_by_count) as pass_by, SUM(enter_count) as enter_cnt
            FROM store_flow_data
            WHERE store_id = ? AND data_date BETWEEN ? AND ?
            GROUP BY data_date ORDER BY data_date
        """, (store_id, start.isoformat(), end.isoformat())).fetchall()
    else:
        rows = conn.execute("""
            SELECT data_date, SUM(pass_by_count) as pass_by, SUM(enter_count) as enter_cnt
            FROM store_flow_data
            WHERE data_date BETWEEN ? AND ?
            GROUP BY data_date ORDER BY data_date
        """, (start.isoformat(), end.isoformat())).fetchall()

    if len(rows) < 14:
        conn.close()
        return {"error": "历史数据不足（至少需要14天）"}

    hist_dates = [r['data_date'] for r in rows]
    passerby = np.array([r['pass_by'] for r in rows], dtype=float)
    enter_cnt = np.array([r['enter_cnt'] for r in rows], dtype=float)

    X_hist = build_features(hist_dates)

    # 预测日期
    pred_dates = [(end + timedelta(days=i+1)).isoformat() for i in range(horizon)]
    X_pred = build_features(pred_dates)

    def train_and_predict(y, name):
        model = XGBRegressor(
            n_estimators=100, max_depth=4, learning_rate=0.1,
            subsample=0.8, reg_alpha=0.1, random_state=42
        )
        model.fit(X_hist, y)

        # 预测 + 简单置信区间（基于训练残差 std）
        pred = model.predict(X_pred)
        residuals = y - model.predict(X_hist)
        std = np.std(residuals)
        lower = np.maximum(0, pred - 1.96 * std).astype(int)
        upper = (pred + 1.96 * std).astype(int)
        return pred.astype(int), lower, upper, float(std)

    passerby_pred, passerby_lower, passerby_upper, p_std = train_and_predict(passerby, '过店人次')
    enter_pred, enter_lower, enter_upper, e_std = train_and_predict(enter_cnt, '进店人次')

    conn.close()

    return {
        "hist_dates": hist_dates[-14:],
        "passerby_actual": passerby[-14:].astype(int).tolist(),
        "enter_actual": enter_cnt[-14:].astype(int).tolist(),
        "pred_dates": pred_dates,
        "passerby_pred": passerby_pred.tolist(),
        "passerby_lower": passerby_lower.tolist(),
        "passerby_upper": passerby_upper.tolist(),
        "enter_pred": enter_pred.tolist(),
        "enter_lower": enter_lower.tolist(),
        "enter_upper": enter_upper.tolist(),
        "metrics": {
            "passerby_avg": int(np.mean(passerby_pred)),
            "enter_avg": int(np.mean(enter_pred)),
            "passerby_std": round(p_std),
            "enter_std": round(e_std),
            "passerby_trend": "↑ 上升" if passerby_pred[-1] > passerby_pred[0] else "↓ 下降",
            "enter_trend": "↑ 上升" if enter_pred[-1] > enter_pred[0] else "↓ 下降",
        }
    }

def backtest_flow(store_id: str = None, test_start: str = None, test_end: str = None, lookback: int = 60):
    """
    回测：在指定区间对比预测值 vs 真实值，计算 MAPE 误差
    """
    conn = get_db()
    start_d = date.fromisoformat(test_start or (date.today() - timedelta(days=14)).isoformat())
    end_d = date.fromisoformat(test_end or (date.today() - timedelta(days=1)).isoformat())
    train_end = start_d - timedelta(days=1)
    train_start = train_end - timedelta(days=lookback)

    base_sql = "FROM store_flow_data WHERE data_date BETWEEN ? AND ?"
    base_params = [train_start.isoformat(), train_end.isoformat()]
    if store_id: base_sql += " AND store_id = ?"; base_params.append(store_id)

    train_rows = conn.execute(f"SELECT data_date, SUM(pass_by_count) as pass_by, SUM(enter_count) as enter_cnt {base_sql} GROUP BY data_date ORDER BY data_date", base_params).fetchall()

    test_params = [start_d.isoformat(), end_d.isoformat()]
    if store_id: test_params.append(store_id)
    test_rows = conn.execute(f"SELECT data_date, SUM(pass_by_count) as pass_by, SUM(enter_count) as enter_cnt {base_sql} GROUP BY data_date ORDER BY data_date", test_params).fetchall()

    if len(train_rows) < 14 or len(test_rows) < 1:
        conn.close()
        return {"error": f"数据不足：训练{len(train_rows)}天，测试{len(test_rows)}天"}

    train_dates = [r['data_date'] for r in train_rows]
    passerby_train = np.array([r['pass_by'] for r in train_rows], dtype=float)
    enter_train = np.array([r['enter_cnt'] for r in train_rows], dtype=float)
    test_dates = [r['data_date'] for r in test_rows]
    passerby_test = np.array([r['pass_by'] for r in test_rows], dtype=float)
    enter_test = np.array([r['enter_cnt'] for r in test_rows], dtype=float)

    X_train = build_features(train_dates)
    X_test = build_features(test_dates)

    def train_and_eval(y_train, y_test):
        model = XGBRegressor(n_estimators=100, max_depth=4, learning_rate=0.1, subsample=0.8, reg_alpha=0.1, random_state=42)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        y_pred = np.maximum(y_pred, 0)
        ape = np.abs((y_test - y_pred) / np.maximum(y_test, 1)) * 100
        mape = float(np.mean(ape))
        return y_pred.astype(int).tolist(), ape.round(2).tolist(), round(mape, 2)

    passerby_pred, passerby_ape, passerby_mape = train_and_eval(passerby_train, passerby_test)
    enter_pred, enter_ape, enter_mape = train_and_eval(enter_train, enter_test)

    conn.close()
    return {
        "test_dates": test_dates,
        "passerby_actual": passerby_test.astype(int).tolist(),
        "passerby_pred": passerby_pred,
        "passerby_ape": passerby_ape,
        "passerby_mape": passerby_mape,
        "enter_actual": enter_test.astype(int).tolist(),
        "enter_pred": enter_pred,
        "enter_ape": enter_ape,
        "enter_mape": enter_mape,
        "overall_mape": round((passerby_mape + enter_mape) / 2, 2),
    }
