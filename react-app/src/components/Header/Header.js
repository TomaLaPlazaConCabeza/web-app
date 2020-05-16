import React, { PureComponent } from 'react';
import { Box, AppBar } from '@material-ui/core';

import style from './Header.module.scss';

class Header extends PureComponent {

  render() {
    return (
      <AppBar className={style.wrapper} position="static" >
        <p>This is the app :)</p>
      </AppBar>
    );
  }

}

export default Header;
