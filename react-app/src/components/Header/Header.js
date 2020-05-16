import React, { PureComponent } from 'react';
import { Box } from '@material-ui/core';

import style from './Header.module.scss';

class Header extends PureComponent {

  render() {
    return (
      <Box className={style.wrapper}></Box>
    );
  }

}

export default Header;
