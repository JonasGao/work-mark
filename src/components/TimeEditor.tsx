import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import { Save } from '@material-ui/icons';

const TimeEditor = (props: { onUpdate: (time: number) => void }) => {
  const [value, setValue] = useState<string>();
  const save = () => {
    const v = value;
    if (!v) {
      return;
    }
    const strings = v.split(':');
    if (strings.length != 3) {
      return;
    }
    const date = new Date();
    date.setHours(parseInt(strings[0]));
    date.setMinutes(parseInt(strings[1]), parseInt(strings[2]), 0);
    let time = date.getTime();
    if (isNaN(time)) {
      return;
    }
    props.onUpdate(time);
  };
  return (
    <>
      <TextField
        type="text"
        value={value}
        placeholder="请输入时间 HH:mm:ss"
        onChange={e => setValue(e.target.value)}
      />
      <IconButton onClick={save}>
        <Save />
      </IconButton>
    </>
  );
};

export default TimeEditor;
