import React, { Component, Suspense, lazy } from 'react';
import { TextField } from '@material-ui/core';

import loadGoogleApi from '../../utils/googleLoader';
import { Loader } from '../../components';

import style from './Map.module.scss';

class Map extends Component {

  constructor(props) {
    super(props);
    this.state = {
      polygons: [],
    };

    this.containerRef = null;
    this.mapRef = null;
    this.searchRef = null;
  }

  componentDidMount() {
    const { api: { maps } } = this.props;
    console.log(maps);

    this.map = new maps.Map(this.mapRef, {
      center: { lat: -34.397, lng: 150.644 },
      zoom: 8,
    });

    this.autocomplete = new maps.places.Autocomplete(this.searchRef.querySelector('input'));

    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition( (position) => {
        const initialLocation = new maps.LatLng(position.coords.latitude, position.coords.longitude);
        this.map.setCenter(initialLocation);
      });
    }

    this.map.addListener('click', this.handleMapClick);
  }

  handleMapClick = (e) => {
    const { latLng } = e;
    console.log(latLng);
  }

  render() {
    return (
      <div className={style.wrapper} ref={(ref) => (this.containerRef = ref)}>
        <div className={style.toolbar}>
          <TextField label='Search' ref={(ref) => (this.searchRef = ref)} size="small" type="text" variant="outlined" />

        </div>
        <div className={style.map} ref={(ref) => (this.mapRef = ref)} />
      </div>
    );
  }

}

const LazyMap = lazy(async () => {
  const api = await loadGoogleApi();
  return { default: (props) => <Map {...props} api={api} /> };
});

export default () => {
  return (
    <Suspense fallback={<Loader />}>
      <LazyMap />
    </Suspense>
  );
};
