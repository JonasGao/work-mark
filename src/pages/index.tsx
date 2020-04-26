import React, { useState } from 'react';
import styles from './index.less';

interface Row {
  time: number,
  desc: string
}

type AddRow = () => void;

type ResetRows = () => void;

type UpdateRow = (row: Row, desc: string) => void;

function getTime(timestamp: number) {
  const date = new Date(timestamp);
  return `${ date.getHours() }:${ date.getMinutes() }:${ date.getSeconds() }.${ date.getMilliseconds() }`;
}

class LocalRows {
  static KEY = 'local-mark-rows';

  loadRows(): Row[] {
    const item = window.localStorage.getItem(LocalRows.KEY);
    if (item) {
      return JSON.parse(item);
    }
    return [];
  }

  writeRows(rows: Row[]) {
    const json = JSON.stringify(rows);
    window.localStorage.setItem(LocalRows.KEY, json);
  }
}

const localRows = new LocalRows();

function initRows() {
  return localRows.loadRows();
}

function useRows(): [Row[], AddRow, UpdateRow, ResetRows] {
  const [rows, setRows] = useState(initRows);
  const saveRows = (rows: Row[]) => {
    localRows.writeRows(rows);
    setRows(rows);
  };
  const addRow: AddRow = () => {
    const row = {
      time: new Date().getTime(),
      desc: '',
    };
    const newRows = [...rows, row];
    saveRows(newRows);
  };
  const updateRow: UpdateRow = (row, desc) => {
    saveRows(rows.map(r => {
      if (r === row) {
        return {
          time: r.time,
          desc: desc,
        };
      }
      return r;
    }));
  };
  const resetRows = () => {
    saveRows([]);
  };
  return [rows, addRow, updateRow, resetRows];
}

function getSpan(rows: Row[], index: number) {
  if (index < 1) {
    return 0;
  }
  const curr = rows[ index ];
  const latest = rows[ index - 1 ];
  const span = curr.time - latest.time;
  const second = span / 1000;
  const s = second % 60;
  const m = second > s ? ((second - s) / 60 % 60) : 0;
  const h = second > (second % 3600) ? (second / 60 / 60) : 0;
  return `${ h.toFixed(0) }:${ m }:${ s.toFixed(3) }`;
}

export default () => {
  const [rows, addRow, updateRow, resetRows] = useRows();

  return (
    <div className={ styles.main }>
      <div>
        <button className={styles.btn} onClick={ addRow }>打卡</button>
        <button className={styles.btn} onClick={ resetRows }>重置</button>
      </div>
      <table className={ styles.rows }>
        <tbody>
        {
          rows.map((row, index) => (
            <tr key={ row.time }>
              <td className={styles.colTime}>{ getTime(row.time) }</td>
              <td>
                <input
                  type="text"
                  value={ row.desc }
                  placeholder="请输入内容"
                  onChange={ e => updateRow(row, e.target.value) }
                  className={ styles.descInput }
                />
              </td>
              <td className={styles.colSpan}>
                { getSpan(rows, index) }
              </td>
            </tr>
          ))
        }
        </tbody>
      </table>
    </div>
  );
}
