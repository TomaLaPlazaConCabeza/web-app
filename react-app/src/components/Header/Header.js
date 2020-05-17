import React, { PureComponent } from 'react';
import { Box, AppBar } from '@material-ui/core';

import style from './Header.module.scss';

class Header extends PureComponent {

  render() {
    return (
      <AppBar className={style.wrapper} position="static" >
        <p>Reconquer your plazas - with your brain</p>
      </AppBar>
    );
  }

}

export default Header;
