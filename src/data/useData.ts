/**
 * 表示一个工作的状态，是开始，还是结束，还是正在进行
 */
type WorkStatus = 'start' | 'finish' | 'doing';

/**
 * 表示当前在处理的一个工作。比如在某某时间开始做某某事。比如在某某时间正在做，比如在某某时间做完
 * 某事
 */
interface Work {
  /**
   * 表示当前这个工作的状态
   */
  status: WorkStatus;
  /**
   * 当前打卡记录的时间
   */
  time?: number;
  /**
   * 描述，比如具体是什么事情
   */
  desc: string;
}

/**
 * 追加一个指定状态的工作
 */
type AppendWork = (status: WorkStatus) => void;

/**
 * 在指定位置插入一个指定状态的工作
 */
type InsertWork = (index: number) => void;

/**
 * 重置所有数据
 */
type Reset = () => void;

/**
 * 更新指定位置的工作数据
 */
type UpdateWork = (index: number, row: Work) => void;

/**
 * 删除指定位置的工作数据
 */
type RemoveWork = (index: number) => void;

type WorkState = [
  Work[],
  AppendWork,
  InsertWork,
  Reset,
  UpdateWork,
  RemoveWork,
];

type Span = [number, number, number];

/**
 * 格式化时间戳，转成 HH:mm:ss 格式的时间
 *
 * @param timestamp
 */
function getTime(timestamp?: number) {
  if (!timestamp) {
    return '';
  }
  const date = new Date(timestamp);
  return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;
}

function toSpan(milliseconds: number): Span {
  const second = milliseconds / 1000;
  const s = second % 60;
  const m = second > s ? ((second - s) / 60) % 60 : 0;
  const h = second > second % 3600 ? second / 60 / 60 : 0;
  return [Math.floor(h), Math.floor(m), s];
}

function getSpan(rows: Work[], index: number): Span {
  if (index < 1) {
    return [0, 0, 0];
  }
  const curr = rows[index];
  if (!curr.time) {
    return [0, 0, 0];
  }
  const latest = rows[index - 1];
  if (!latest.time) {
    return [0, 0, 0];
  }
  if (curr.time < latest.time) {
    return [0, 0, 0];
  }
  return toSpan(curr.time - latest.time);
}

function formatSpan(rows: Work[], index: number) {
  const [h, m, s] = getSpan(rows, index);
  let str = '';
  if (h) {
    str += h.toFixed(0) + ' 小时 ';
  }
  if (m) {
    str += m.toFixed(0) + ' 分钟 ';
  }
  return `${str} ${s.toFixed(0)} 秒`;
}

function exportSpan(rows: Work[]) {
  const lines: { span: number; desc: string }[] = [];
  let latestStatus: WorkStatus;
  let latestTime: number;
  let latestDesc: string;
  rows.forEach(r => {
    if (!r.time) {
      return;
    }
    if (!latestStatus) {
      latestTime = r.time;
      latestDesc = r.desc;
      latestStatus = r.status;
      return;
    }
    switch (latestStatus) {
      case 'start':
        switch (r.status) {
          case 'start':
            lines.push({ span: r.time - latestTime, desc: latestDesc });
            latestTime = r.time;
            latestDesc = r.desc;
            return;
          case 'finish':
            lines.push({ span: r.time - latestTime, desc: latestDesc });
            latestTime = r.time;
            latestDesc = r.desc;
            latestStatus = r.status;
            return;
          case 'doing':
            if (!latestDesc && r.desc) {
              latestDesc = r.desc;
            }
            latestStatus = r.status;
            return;
          default:
        }
        return;
      case 'finish':
        switch (r.status) {
          case 'start':
            latestStatus = r.status;
            latestTime = r.time;
            latestDesc = r.desc;
            return;
          case 'finish':
            lines.push({ span: r.time - latestTime, desc: r.desc });
            latestTime = r.time;
            latestDesc = r.desc;
            return;
          case 'doing':
            if (!latestDesc && r.desc) {
              latestDesc = r.desc;
            }
            latestStatus = r.status;
            return;
          default:
        }
        return;
      case 'doing':
        switch (r.status) {
          case 'finish':
          case 'start':
            lines.push({ span: r.time - latestTime, desc: latestDesc });
            latestStatus = r.status;
            latestTime = r.time;
            latestDesc = r.desc;
            return;
          case 'doing':
          default:
        }
        return;
      default:
        return;
    }
  });
  return lines
    .map(l => {
      let str = '';
      const [h, m] = toSpan(l.span);
      if (h) {
        str += h.toFixed(0) + '小时';
      }
      if (m) {
        str += m.toFixed(0) + '分钟';
      }
      return `${l.desc}（${str}）`;
    })
    .join('\n');
}

class LocalWorkRepo {
  static KEY = 'local-mark-rows';

  load(): Work[] {
    const item = window.localStorage.getItem(LocalWorkRepo.KEY);
    if (item) {
      return JSON.parse(item);
    }
    return [];
  }

  write(rows: Work[]) {
    const json = JSON.stringify(rows);
    window.localStorage.setItem(LocalWorkRepo.KEY, json);
  }
}

const LOCAL_WORK_REPO = new LocalWorkRepo();

/**
 * 工作数据
 */
function useWorks(): WorkState {
  const [rows, setRows] = useState(LOCAL_WORK_REPO.load());
  const save = (rows: Work[]) => {
    LOCAL_WORK_REPO.write(rows);
    setRows(rows);
  };
  const append: AppendWork = status => {
    const row: Work = {
      status,
      time: new Date().getTime(),
      desc: '',
    };
    save([...rows, row]);
  };
  const insert: InsertWork = index => {
    const row: Work = {
      status: 'start',
      desc: '',
    };
    save([...rows.slice(0, index), row, ...rows.splice(index)]);
  };
  const reset: Reset = () => {
    save([]);
  };
  const update: UpdateWork = (index, row) => {
    rows[index] = row;
    save([...rows]);
  };
  const remove: RemoveWork = index => {
    rows.splice(index, 1);
    save([...rows]);
  };
  return [rows, append, insert, reset, update, remove];
}
