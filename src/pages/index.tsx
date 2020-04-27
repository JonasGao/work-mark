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

function getSpan(rows: Row[], index: number): [number, number, number] {
  if (index < 1) {
    return [0, 0, 0];
  }
  const curr = rows[ index ];
  const latest = rows[ index - 1 ];
  const span = curr.time - latest.time;
  const second = span / 1000;
  const s = second % 60;
  const m = second > s ? ((second - s) / 60 % 60) : 0;
  const h = second > (second % 3600) ? (second / 60 / 60) : 0;
  return [h, m, s];
}

function formatSpan(rows: Row[], index: number) {
  const [h, m, s] = getSpan(rows, index);
  return `${ h.toFixed(0) }:${ m }:${ s.toFixed(3) }`;
}

function exportSpan(rows: Row[], index: number) {
  let [h, m] = getSpan(rows, index);
  console.info(1, h, m, index, rows);
  for (let i = index - 1; i >= 0; i--) {
    const r = rows[ i ];
    console.log(2, r.desc);
    if (r.desc) {
      break;
    }
    const [h1, m1] = getSpan(rows, i);
    console.log(3, h1, m1);
    h += h1;
    m += m1;
  }
  let str = '';
  if (h) {
    str += h.toFixed(0) + '小时';
  }
  if (m) {
    str += m.toFixed(0) + '分钟';
  }
  return str;
}

export default () => {
  const [rows, addRow, updateRow, resetRows] = useRows();
  const [exportContent, setExportContent] = useState<string>();
  const doResetRows = () => {
    if (confirm('确定重置？')) {
      resetRows();
    }
  };
  const doExport = () => {
    const content = rows.map((r, index) => {
      if (!r.desc) {
        return null;
      }
      const span = exportSpan(rows, index);
      return `${ r.desc }（${ span }）`;
    }).filter(s => !!s).join('\n');
    setExportContent(content);
  };
  return (
    <div className={ styles.main }>
      <div>
        <button className={ styles.btn } onClick={ addRow }>打卡</button>
        <button className={ styles.btn } onClick={ doResetRows }>重置</button>
        <button className={ styles.btn } onClick={ doExport }>导出</button>
      </div>
      <table className={ styles.rows }>
        <tbody>
        {
          rows.map((row, index) => (
            <tr key={ row.time }>
              <td className={ styles.colTime }>{ getTime(row.time) }</td>
              <td>
                <input
                  type="text"
                  value={ row.desc }
                  placeholder="请输入内容"
                  onChange={ e => updateRow(row, e.target.value) }
                  className={ styles.descInput }
                />
              </td>
              <td className={ styles.colSpan }>
                { formatSpan(rows, index) }
              </td>
            </tr>
          ))
        }
        </tbody>
      </table>
      <textarea
        cols={ 100 }
        rows={ 20 }
        value={ exportContent }
      />
    </div>
  );
}
