import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { BottomNavigationAction, BottomNavigation, AppBar } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faMap, faQuestion } from '@fortawesome/free-solid-svg-icons';

import { HOME_ROUTE, MAP_ROUTE, ABOUT_ROUTE } from '../../constants/routes';

import style from './Navigation.module.scss';

class Navigation extends Component {

  handleChange = (e, path) => {
    const { history } = this.props;
    history.push(path);
  }

  render() {
    return (
      <AppBar className={style.wrapper} position="fixed">
        <BottomNavigation onChange={this.handleChange}>
          <BottomNavigationAction icon={<FontAwesomeIcon icon={faHome} size='2x' />} label="Home" value={HOME_ROUTE} />
          <BottomNavigationAction icon={<FontAwesomeIcon icon={faMap} size='2x' />} label="Map" value={MAP_ROUTE} />
          <BottomNavigationAction icon={<FontAwesomeIcon icon={faQuestion} size='2x' />} label="About" value={ABOUT_ROUTE} />
        </BottomNavigation>
      </AppBar>
    );
  }

}

export default withRouter(Navigation);
