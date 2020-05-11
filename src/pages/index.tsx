import React, { useState } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import {
  createMuiTheme,
  ThemeProvider,
  makeStyles,
  createStyles,
  Theme,
} from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import '../sw';
import styles from './index.less';
import Container from '@material-ui/core/Container';
import TableContainer from '@material-ui/core/TableContainer';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableHead from '@material-ui/core/TableHead';
import TableCell from '@material-ui/core/TableCell';
import IconButton from '@material-ui/core/IconButton';
import { Close, Add, Save } from '@material-ui/icons';
import EditIcon from '@material-ui/icons/Edit';
import { Box, MenuItem, Select, Typography } from '@material-ui/core';

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

function getSpan(rows: Work[], index: number): [number, number, number] {
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
  const span = curr.time - latest.time;
  const second = span / 1000;
  const s = second % 60;
  const m = second > s ? ((second - s) / 60) % 60 : 0;
  const h = second > second % 3600 ? second / 60 / 60 : 0;
  return [Math.floor(h), Math.floor(m), s];
}

function formatSpan(rows: Work[], index: number) {
  const [h, m, s] = getSpan(rows, index);
  let str = '';
  if (h) {
    str += h.toFixed(0) + '小时';
  }
  if (m) {
    str += m.toFixed(0) + '分钟';
  }
  return `${str} ${s.toFixed(0)} 秒`;
}

function exportSpan(rows: Work[], index: number) {
  let [h, m] = getSpan(rows, index);
  console.info(1, h, m, index, rows);
  for (let i = index - 1; i >= 0; i--) {
    const r = rows[i];
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

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      '& > *': {
        margin: theme.spacing(1),
      },
    },
  }),
);

const TimeEditor = (props: { onUpdate: (time: number) => void }) => {
  const [value, setValue] = useState();

  return (
    <TextField
      type="text"
      value={value}
      placeholder="请输入时间 HH:mm:ss"
      onChange={e => {
        const v = e.target.value;
        if (!v) {
          return;
        }
        const strings = v.split(':');
        if (strings.length != 3) {
          return;
        }
        const date = new Date();
        date.setHours(parseInt(strings[0]));
        date.setMinutes(parseInt(strings[1]), parseInt(strings[2]));
        let time = date.getTime();
        if (isNaN(time)) {
        }
        props.onUpdate(time);
      }}
    />
  );
};

export default () => {
  const [rows, append, insert, reset, update, remove] = useWorks();

  const [exportContent, setExportContent] = useState<string>();

  const doResetRows = () => {
    if (confirm('确定重置？')) {
      reset();
    }
  };

  const doExport = () => {
    // const content = rows
    //   .map((r, index) => {
    //     if (!r.desc) {
    //       return null;
    //     }
    //     const span = exportSpan(rows, index);
    //     return `${r.desc}（${span}）`;
    //   })
    //   .filter(s => !!s)
    //   .join('\n');
    // setExportContent(content);
  };

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode],
  );

  const classes = useStyles();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container>
        <div className={classes.root}>
          <Button
            className={styles.btn}
            variant="contained"
            color="primary"
            onClick={() => append('start')}
          >
            开始
          </Button>
          <Button
            className={styles.btn}
            variant="contained"
            color="primary"
            onClick={() => append('finish')}
          >
            结束
          </Button>
          <Button
            className={styles.btn}
            variant="contained"
            color="primary"
            onClick={() => append('doing')}
          >
            打卡
          </Button>
          <Button
            className={styles.btn}
            variant="contained"
            color="secondary"
            onClick={doResetRows}
          >
            重置
          </Button>
          <Button className={styles.btn} variant="contained" onClick={doExport}>
            导出
          </Button>
        </div>
        <Paper>
          {rows.map((row, index) => (
            <Box
              display={'flex'}
              alignItems={'center'}
              className={classes.root}
            >
              {row.time ? (
                <Typography display={'inline'}>{getTime(row.time)}</Typography>
              ) : (
                <TextField
                  type="text"
                  value={row.time}
                  placeholder="请输入时间 HH:mm:ss"
                  onChange={e => {
                    const v = e.target.value;
                    if (!v) {
                      return;
                    }
                    const strings = v.split(':');
                    if (strings.length != 3) {
                      return;
                    }
                    const now = new Date();
                    now.setHours(parseInt(strings[0]));
                    now.setMinutes(parseInt(strings[1]), parseInt(strings[2]));
                    update(index, { ...row, time: now.getTime() });
                  }}
                />
              )}
              <Select
                value={row.status}
                onChange={e =>
                  update(index, {
                    ...row,
                    status: e.target.value as WorkStatus,
                  })
                }
              >
                <MenuItem value={'start'}>开始</MenuItem>
                <MenuItem value={'finish'}>结束</MenuItem>
                <MenuItem value={'doing'}>正在</MenuItem>
              </Select>
              <TextField
                type="text"
                value={row.desc}
                placeholder="请输入内容"
                onChange={e => update(index, { ...row, desc: e.target.value })}
              />
              <Typography display={'inline'}>
                {'用时 ' + formatSpan(rows, index)}
              </Typography>
              <IconButton onClick={() => remove(index)}>
                <Close />
              </IconButton>
              <IconButton onClick={() => insert(index)}>
                <Add />
              </IconButton>
            </Box>
          ))}
        </Paper>
        <Grid container justify="center" alignItems="center">
          <Grid item xs={12}>
            <TextField multiline rows={20} fullWidth value={exportContent} />
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
};
