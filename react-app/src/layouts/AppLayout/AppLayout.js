import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';
import { Container } from '@material-ui/core';

import { HOME_ROUTE, MAP_ROUTE, ABOUT_ROUTE } from '../../constants/routes';
import { Navigation, Header } from '../../components';
import { Home, Map, About } from '../../pages';

import style from './AppLayout.module.scss';

class AppLayout extends Component {

  render() {
    return (
      <div className={style.wrapper}>
        <Header />
        <Container className={style.content}>
          <Switch>
            <Route path={MAP_ROUTE}>
              <Map />
            </Route>
            <Route path={ABOUT_ROUTE}>
              <About />
            </Route>
            <Route path={HOME_ROUTE}>
              <Home />
            </Route>
          </Switch>
        </Container>
        <Navigation />
      </div>
    );
  }

}

export default AppLayout;
