import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { BottomNavigationAction, BottomNavigation } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHome, faMap, faQuestion } from '@fortawesome/free-solid-svg-icons'

import { HOME_ROUTE, MAP_ROUTE, ABOUT_ROUTE } from '../../constants/routes';


class Navigation extends Component {

  handleChange = (e, path) => {
    const { history } = this.props;
    history.push(path)
  }

  render() {
    return (
      <BottomNavigation onChange={this.handleChange}>
         <BottomNavigationAction label="Home" value={HOME_ROUTE} icon={<FontAwesomeIcon icon={faHome} size='2x' />} />
         <BottomNavigationAction label="Map" value={MAP_ROUTE} icon={<FontAwesomeIcon icon={faMap} size='2x' />} />
         <BottomNavigationAction label="About" value={ABOUT_ROUTE} icon={<FontAwesomeIcon icon={faQuestion} size='2x' />} />
      </BottomNavigation>
    );
  }

}

export default withRouter(Navigation);
