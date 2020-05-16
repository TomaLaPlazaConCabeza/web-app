import React, { Component, Suspense, lazy } from 'react';
import { TextField, Button, Box, Grid, List, ListItem, ListItemText, ListItemSecondaryAction, Tooltip, Paper } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDrawPolygon, faCheck, faTrash } from '@fortawesome/free-solid-svg-icons';


import loadGoogleApi from '../../utils/googleLoader';
import { postPolygons } from '../../utils/api';
import { Loader } from '../../components';

import style from './Map.module.scss';

const TYPE_POLYGON = 'poly';

// const flattenPolygon = (p) => {
//   return p.reduce((acc, n) => {
//     if(n.getArray) return [ ...acc, ...flattenPolygon(n.getArray()) ];
//     acc.push(n);
//     return acc;
//   }, []);
// };

class Map extends Component {

  constructor(props) {
    super(props);
    this.state = {
      polygons: {},
      search: '',
      humans: 0,
    };

    this.containerRef = null;
    this.mapRef = null;
    this.searchRef = null;
  }

  componentDidMount() {
    const { api: { maps } } = this.props;

    this.map = new maps.Map(this.mapRef, {
      center: { lat: 28.3654241, lng: -16.8173312 },
      zoom: 20,
    });


    this.autocomplete = new maps.places.Autocomplete(this.searchRef.querySelector('input'));
    this.autocomplete.bindTo('bounds', this.map);
    this.autocomplete.addListener('place_changed', this.handleSearch);

    // if(navigator.geolocation) {
    //   navigator.geolocation.getCurrentPosition( (position) => {
    //     const initialLocation = new maps.LatLng(position.coords.latitude, position.coords.longitude);
    //     this.map.panTo(initialLocation);
    //   });
    // }

    var drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: maps.ControlPosition.BOTTOM_CENTER,
        drawingModes: [ 'polygon' ],
      },

      polygonOptions: {
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        editable: true,
        draggable: true,
        zIndex: 1,
      },
    });
    drawingManager.setMap(this.map);
    maps.event.addListener(drawingManager, 'polygoncomplete', this.handlePolyComplete);

    this.map.addListener('mousemove', this.handleMapMouseMove);
    document.body.addEventListener('mouseup', this.handleMouseUp);
  }

  componentWillUnmount() {
    document.body.removeEventListener('mouseup', this.handleMouseUp);
  }


  getBoundsZoomLevel(bounds) {
    var WORLD_DIM = { height: 256, width: 256 };
    var ZOOM_MAX = 21;

    function latRad(lat) {
      var sin = Math.sin(lat * Math.PI / 180);
      var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
      return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    }

    function zoom(mapPx, worldPx, fraction) {
      return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }

    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();

    var latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;

    var lngDiff = ne.lng() - sw.lng();
    var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

    var latZoom = zoom(this.mapRef.offsetHeight, WORLD_DIM.height, latFraction);
    var lngZoom = zoom(this.mapRef.offsetWidth, WORLD_DIM.width, lngFraction);

    return Math.min(latZoom, lngZoom, ZOOM_MAX);
  }

  addPolygon = (coords) => {
    const { api: { maps } } = this.props;



    const bounds = this.map.getBounds();

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const h = Math.abs(ne.lat() - sw.lat()) * .7;
    const w = Math.abs(ne.lng() - sw.lng()) * .7;

    let offset;
    try { offset = new maps.LatLng(this.map.center.lat() - coords.lat(), this.map.center.lng() - coords.lng()); }
    catch (err) { offset = new maps.LatLng(0, 0); }

    const paths = [
      new maps.LatLng(ne.lat() - (h / 2) - offset.lat(), ne.lng() - (w / 2) - offset.lng()),
      new maps.LatLng(ne.lat() - (h / 2) - offset.lat(), sw.lng() + (w / 2) - offset.lng()),
      new maps.LatLng(sw.lat() + (h / 2) - offset.lat(), sw.lng() + (w / 2) - offset.lng()),
      new maps.LatLng(sw.lat() + (h / 2) - offset.lat(), ne.lng() - (w / 2) - offset.lng()),
    ];

    const poly = new maps.Polygon({
      paths,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35,
      editable: true,
      draggable: true,
    });

    maps.event.addListener(poly, 'rightclick', this.handlePolyRightClick(poly));

    poly.setMap(this.map);
    poly.id = Date.now();

    this.setState(({ polygons }) => ({
      polygons: { ...polygons, [poly.id]: poly },
    }));
  }

  handlePolyComplete = (poly) => {
    const { api: { maps } } = this.props;
    maps.event.addListener(poly, 'rightclick', this.handlePolyRightClick(poly));
    poly.id = Date.now();

    this.setState(({ polygons }) => ({
      polygons: { ...polygons, [poly.id]: poly },
    }));
  }

  handlePolyRightClick = (poly) => () => {
    this.deletePoly(poly);
  }

  deletePoly = (poly) => {
    poly.setMap(null);
    this.setState(({ polygons }) => {
      const clone = { ...polygons };
      delete clone[poly.id];
      return { polygons: clone };
    });
  }

  handleMapMouseMove = (e) => {
    const { latLng } = e;
    this.cursorCoords = latLng;
  }


  handleMouseUp = (e) => {
    if(this.dragging && this.mapRef.contains(e.target)) {
      const dragging = this.dragging;
      const coords = this.cursorCoords;

      switch (dragging) {
      case TYPE_POLYGON:
        this.addPolygon(coords);
        break;
      default:
          // do nothing
      }
    }

    this.dragging = null;
  }

  handleSearchInputChange = (e) => {
    this.setState({
      search: e.target.value,
    });
  }

  handleHumansInputChange = (e) => {
    this.setState({
      humans: e.target.value,
    });
  }

  handleSearch = () => {
    const place = this.autocomplete.getPlace();
    if( place && place.geometry ) {
      const { geometry: { location, viewport } } = place;
      setTimeout(() => {
        this.map.setZoom(this.getBoundsZoomLevel(viewport));
      }, 1000);
      this.map.panTo(location);
      this.setState({ search: place.name });
    }
  }

  handleDrag = (type) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.dragging = type;
  }

  handlePolyginListClick = (poly) => {
    const bounds = poly.getBounds();
    this.map.panTo(bounds.getCenter());
    setTimeout(() => {
      this.map.setZoom(this.getBoundsZoomLevel(bounds));
    }, 1000);
  }

  submit = () => {
    const { polygons } = this.state;

    const features = Object.values(polygons).reduce((acc, poly) => {
      if(poly) {
        console.log(poly.getPath());
        const coordinates = poly.getPath().getArray().map((p) => [ p.lng(), p.lat() ]);
        acc.push({
          'type': 'Feature',
          'geometry': {
            'type': 'Polygon',
            coordinates,
          },
          'properties': {
            id: poly.id,
          },
        });
      }
      return acc;
    }, []);

    const request = {
      'features': features,
      'properties': {},
      'type': 'FeatureCollection',
    };

    postPolygons(request);
  }

  render() {
    const { search, polygons } = this.state;
    return (
      <div className={style.wrapper} ref={(ref) => (this.containerRef = ref)}>
        <div className={style.toolbar}>
          <TextField label='Search' onChange={this.handleSearchInputChange} ref={(ref) => (this.searchRef = ref)} size="small" type="text" value={search} variant="outlined" />
          <Box className={style.actions}>
            {/* <TextField label='Humans' onChange={this.handleHumansInputChange} size="small" type="number" value={humans} variant="outlined" /> */}
            <Tooltip title='Add polygon'>
              <Button color="secondary" onClick={this.addPolygon} onMouseDown={this.handleDrag(TYPE_POLYGON)} variant="contained">
                <FontAwesomeIcon icon={faDrawPolygon} />
              </Button>
            </Tooltip>

            <Tooltip title='Calculate'>
              <Button color="primary" onClick={this.submit} variant="contained">
                <FontAwesomeIcon icon={faCheck} />
              </Button>
            </Tooltip>
          </Box>
        </div>
        <Paper className={style.map} ref={(ref) => (this.mapRef = ref)} />


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
