import React, { Component, Suspense, lazy } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDrawPolygon, faList, faBars, faCheck, faTrash, faPlus, faMinus, faUndo, faRedo } from '@fortawesome/free-solid-svg-icons';
import { cloneDeep } from 'lodash';
import { ToggleButtonGroup, ToggleButton, Alert } from '@material-ui/lab';
import * as gh from 'greiner-hormann';

import {
  Box,
  Button,
  ButtonGroup,
  Drawer,
  Hidden,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  TextField,
  Tooltip,
} from '@material-ui/core';

import loadGoogleApi from '../../utils/googleLoader';
import { postPolygons } from '../../utils/api';
import { Loader } from '../../components';

import style from './Map.module.scss';

const TYPE_POLYGON = 'poly';
const ACTION_ADD = 'add';
const ACTION_REMOVE = 'remove';

const flattenPolygon = (p) => {
  return p.reduce((acc, n) => {
    if(n.getArray) return [ ...acc, ...flattenPolygon(n.getArray()) ];
    acc.push(n);
    return acc;
  }, []);
};

function isClockwise(path) {
  const poly = path.getArray().map((p) => [ p.lng(), p.lat() ]);
  var sum = 0;
  for(var i = 0; i < poly.length - 1; i++) {
    var cur = poly[i],
      next = poly[i + 1];
    sum += (next[0] - cur[0]) * (next[1] + cur[1]);
  }
  if(sum > 0) {
    return true;
  } else if(sum < 0) {
    return false;
  }
}


class Map extends Component {

  static defaultProps = {
    polygonOptions: {
      strokeColor: '#acdba3',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#acdba3',
      fillOpacity: 0.2,
      editable: true,
      draggable: true,
      zIndes: 1,
    },
  }

  constructor(props) {
    super(props);
    this.state = {
      polygons: {},
      people: null,
      search: '',
      action: ACTION_ADD,
      error: null,
      personRadius: 1.5,
      barrierSize: 0,
    };

    this.containerRef = null;
    this.mapRef = null;
    this.searchRef = null;

    this.historyStep = 0;
    this.history = [ cloneDeep(this.state) ];
  }

  componentDidMount() {
    const { api: { maps }, polygonOptions } = this.props;

    this.map = new maps.Map(this.mapRef, {
      center: { lat: 28.3654241, lng: -16.8173312 },
      zoom: 20,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeId: maps.MapTypeId.ROADMAP,
    });

    this.autocomplete = new maps.places.Autocomplete(this.searchRef.querySelector('input'));
    this.autocomplete.bindTo('bounds', this.map);
    this.autocomplete.addListener('place_changed', this.handleSearch);

    var drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: maps.ControlPosition.BOTTOM_CENTER,
        drawingModes: [ 'polygon' ],
      },
      polygonOptions,
    });
    drawingManager.setMap(this.map);
    maps.event.addListener(drawingManager, 'polygoncomplete', this.handlePolyComplete);

    this.infoWindow = new maps.InfoWindow({
      content: '',
    });

    this.map.addListener('mousemove', this.handleMapMouseMove);
    document.body.addEventListener('mouseup', this.handleMouseUp);
  }

  componentWillUnmount() {
    document.body.removeEventListener('mouseup', this.handleMouseUp);
  }

  componentDidUpdate(pp, ps) {
    const { api: { maps } } = this.props;
    const ts = this.state;

    if(ps.people !== ts.people) {
      this.map.data.forEach((feature) => feature && this.map.data && this.map.data.remove(feature));

      if(ts.people) {
        this.map.data.addGeoJson(ts.people);

        const colors = [ '#d2bda6', '#b99d7e', '#88705c', '#654732' ];

        this.map.data.setStyle(( feature ) => {
          const iconColor = colors[Math.floor(Math.random() * colors.length)];
          return {
            strokeColor: '#e3d29c',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#e3d29c',
            fillOpacity: 0.2,
            icon: {
              path: Math.random() > .5
                ? 'M128 0c35.346 0 64 28.654 64 64s-28.654 64-64 64c-35.346 0-64-28.654-64-64S92.654 0 128 0m119.283 354.179l-48-192A24 24 0 0 0 176 144h-11.36c-22.711 10.443-49.59 10.894-73.28 0H80a24 24 0 0 0-23.283 18.179l-48 192C4.935 369.305 16.383 384 32 384h56v104c0 13.255 10.745 24 24 24h32c13.255 0 24-10.745 24-24V384h56c15.591 0 27.071-14.671 23.283-29.821z'
                : 'M96 0c35.346 0 64 28.654 64 64s-28.654 64-64 64-64-28.654-64-64S60.654 0 96 0m48 144h-11.36c-22.711 10.443-49.59 10.894-73.28 0H48c-26.51 0-48 21.49-48 48v136c0 13.255 10.745 24 24 24h16v136c0 13.255 10.745 24 24 24h64c13.255 0 24-10.745 24-24V352h16c13.255 0 24-10.745 24-24V192c0-26.51-21.49-48-48-48z',
              scale: 15 / 512 * ( .9 + (Math.random() * .2)),
              fillColor: iconColor,
              strokeColor: iconColor,
              fillOpacity: 1,
              strokeOpacity: 1,
              url: Math.random() > .5 ? `${process.env.PUBLIC_URL}/img/male.svg` : `${process.env.PUBLIC_URL}/img/female.svg`,
              anchor: new maps.Point(128, 512),
            },
          };
        });

        const poly = Object.values(ts.polygons)[0];
        if(poly && this.infoWindow) {
          this.infoWindow.setPosition(Object.values(ts.polygons)[0].getBounds().getCenter());
          this.infoWindow.open(this.map);
          this.infoWindow.setContent(`People: ${ts.people.properties.n_humans}`);
        }
      }
    }

    if(ps.polygons !== ts.polygons) {
      Object.values(ps.polygons).forEach((p) => p.setMap(null));
      Object.values(ts.polygons).forEach((p) => p.setMap(this.map));
    }

    if(!this.historyAction && this.historyPush) {
      this.pushHistory();
    }
    this.historyAction = false;
    this.historyPush = false;
  }

  pushHistory = () => {
    this.historyStep += 1;
    while(this.history.length - 1 > this.historyStep) {
      this.history.pop();
    }
    this.history[this.historyStep] = cloneDeep(this.state);
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

  addPolygon = (coords, polygon = null) => {
    const { api: { maps }, polygonOptions } = this.props;
    const { action } = this.state;

    this.historyPush = true;

    let poly = polygon;

    if(!poly) {
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

      poly = new maps.Polygon({
        paths,
        ...polygonOptions,
      });
    }



    if(action === ACTION_REMOVE) {
      if(isClockwise(poly.getPath())) {
        poly.setPath(poly.getPath().getArray().reverse());
      }
      const bounds = poly.getBounds();
      const polygons = cloneDeep(this.state.polygons);
      const intersectsWidth = Object.values(polygons).filter((p) => {
        return p.getBounds().intersects(bounds);
      });

      const path0 = poly.getPath().getArray().map((p) => [ p.lng(), p.lat() ]);
      intersectsWidth.forEach((p) => {
        const path1 = p.getPath().getArray().map((p) => [ p.lng(), p.lat() ]);

        const paths = gh.diff(path1, path0).map((path) => path.map(([ lng, lat ]) => ({ lng, lat })));
        if(paths.length === 1) {
          const a = p.getPaths().getArray();
          a[0] = paths[0];
          p.setPaths(a);
        }
        else {
          p.setPaths([
            ...p.getPaths().getArray(),
            flattenPolygon(poly.getPaths().getArray()),
          ]);
        }
      });

      this.setState({ polygons });
      return void 0;
    }

    if(action === ACTION_ADD) {
      const bounds = poly.getBounds();
      const intersectsWidth = Object.values(this.state.polygons).filter((p) => {
        return p.getBounds().intersects(bounds);
      });
      if(intersectsWidth.length) {
        if(!isClockwise(poly.getPath())) {
          poly.setPath(poly.getPath().getArray().reverse());
        }
        const path0 = poly.getPath().getArray().map((p) => [ p.lng(), p.lat() ]);
        intersectsWidth.forEach((p) => {
          const path1 = p.getPath().getArray().map((p) => [ p.lng(), p.lat() ]);

          const paths = gh.union(path1, path0).map((path) => path.map(([ lng, lat ]) => ({ lng, lat })));
          const a = p.getPaths().getArray();
          a[0] = paths[0];
          p.setPaths(a);
        });

        this.setState(({ polygons }) => ({
          polygons: { ...polygons },
        }));
        return void 0;
      }
    }

    maps.event.addListener(poly, 'rightclick', this.handlePolyRightClick(poly));


    poly.setMap(this.map);
    poly.id = Date.now();

    this.setState(({ polygons }) => ({
      polygons: { ...polygons, [poly.id]: poly },
    }));
  }

  deletePoly = (poly) => {
    this.historyPush = true;

    poly.setMap(null);
    this.map.data.forEach((feature) => feature && this.map.data && this.map.data.remove(feature));
    this.infoWindow.close();
    this.setState(({ polygons }) => {
      const clone = { ...polygons };
      delete clone[poly.id];
      return { polygons: clone };
    });
  }

  handlePolyComplete = (poly) => {
    poly.setMap(null);
    this.addPolygon(null, poly);
  }

  handlePolyRightClick = (poly) => () => {
    this.deletePoly(poly);
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

  handlePolygonListClick = (poly) => {
    const bounds = poly.getBounds();
    this.map.panTo(bounds.getCenter());
    setTimeout(() => {
      this.map.setZoom(this.getBoundsZoomLevel(bounds));
    }, 1000);
    this.setState({
      polygonsOpen: false,
      miniMenuOpen: false,
    });
  }

  submit = async () => {
    const { polygons, barrierSize, personRadius } = this.state;

    const features = Object.values(polygons).reduce((acc, poly) => {
      if(poly) {
        poly.getPaths().getArray().forEach((shape, i) => {
          const coordinates = [ shape.getArray().map((p) => [ p.lng(), p.lat() ]) ];

          acc.push({
            'type': 'Feature',
            'geometry': {
              'type': 'Polygon',
              coordinates,
            },
            'properties': {
              id: poly.id,
              hole: !!i,
            },
          });
        });
      }
      return acc;
    }, []);

    const request = {
      'features': features,
      'properties': {
        barrierSize,
        personRadius,
      },
      'type': 'FeatureCollection',
    };

    this.setState({ isLoading: true });
    try {
      const people = await postPolygons(request);
      this.setState({
        people,
        isLoading: false,
      });
    }
    catch (err) {
      return this.setState({
        error: err.message,
      });
    }
  }

  handleDrawerToggle = () => {
    const { polygonsOpen } = this.state;
    this.setState({
      polygonsOpen: !polygonsOpen,
    });
  }

  handleClear = () => {
    this.historyPush = true;

    this.setState({
      people: null,
      polygons: {},
    });
  }

  handleActionChange = (e, action) => {
    action && this.setState({
      action,
    });
  }

  undo = () => {
    if(this.historyStep > 0) {
      this.historyStep -= 1;
      this.historyAction = true;
      this.setState({ ...this.history[this.historyStep] });
    }
  }

  redo = () => {
    if(this.historyStep < this.history.length - 1) {
      this.historyStep += 1;
      this.historyAction = true;
      this.setState({ ...this.history[this.historyStep] });
    }
  }

  handleInputChange = (name) => (e) => {
    this.setState({
      [name]: e.target.value,
    });
  }

  render() {
    const {
      search, polygons, polygonsOpen, miniMenuOpen, action, error, personRadius, barrierSize, people,
    } = this.state;


    return (
      <div className={style.wrapper} ref={(ref) => (this.containerRef = ref)}>
        <Box className={style.toolbar}>
          <TextField label='Search' onChange={this.handleSearchInputChange} ref={(ref) => (this.searchRef = ref)} size="small" type="text" value={search} variant="outlined" />

          {/* <TextField label='Humans' onChange={this.handleHumansInputChange} size="small" type="number" value={humans} variant="outlined" /> */}
          <Hidden xsDown>
            <Box className={style.actions}>
              <TextField label='Social distance' min={0} onChange={this.handleInputChange('personRadius')} size="small" type="number" value={personRadius} variant="outlined" />
              <TextField label='Barrier size' min={0} onChange={this.handleInputChange('barrierSize')} size="small" type="number" value={barrierSize} variant="outlined" />


              <ToggleButtonGroup exclusive onChange={this.handleActionChange} value={action}>

                <ToggleButton value={ACTION_ADD}>
                  <FontAwesomeIcon icon={faPlus} />
                </ToggleButton>

                <ToggleButton value={ACTION_REMOVE} >
                  <FontAwesomeIcon icon={faMinus} />
                </ToggleButton>
              </ToggleButtonGroup>

              <ButtonGroup>
                <Tooltip title='Undo'>
                  <Button onClick={this.undo} variant="contained">
                    <FontAwesomeIcon icon={faUndo} />
                  </Button>
                </Tooltip>

                <Tooltip title='Redo'>
                  <Button onClick={this.redo} variant="contained">
                    <FontAwesomeIcon icon={faRedo} />
                  </Button>
                </Tooltip>
              </ButtonGroup>

              <ButtonGroup>
                <Tooltip title='Add polygon'>
                  <Button onClick={this.addPolygon} onMouseDown={this.handleDrag(TYPE_POLYGON)} variant="contained">
                    <FontAwesomeIcon icon={faDrawPolygon} />
                  </Button>
                </Tooltip>

                <Tooltip title='Clear'>
                  <Button onClick={this.handleClear} variant="contained">
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </Tooltip>
              </ButtonGroup>

              <ButtonGroup>
                <Tooltip title='Calculate'>
                  <Button color="primary" onClick={this.submit} variant="contained">
                    <FontAwesomeIcon icon={faCheck} />
                  </Button>
                </Tooltip>

                <Tooltip title='Polygons'>
                  <Button onClick={this.handleDrawerToggle} variant="contained">
                    <FontAwesomeIcon icon={faList} />
                  </Button>
                </Tooltip>
              </ButtonGroup>

            </Box>
          </Hidden>
          <Hidden smUp>
            <Box>
              <Button onClick={() => this.setState({ miniMenuOpen: !miniMenuOpen })} ref={(ref) => (this.miniMenuRef = ref)} variant="contained">
                <FontAwesomeIcon icon={faBars} />
              </Button>
              <Menu
                anchorEl={this.miniMenuRef}
                keepMounted
                onClose={() => this.setState({ miniMenuOpen: !miniMenuOpen })}
                open={!!miniMenuOpen}
              >

                <MenuItem color="primary" onClick={this.submit} variant="contained">
                  <Box className={style.menuOption}>
                    <FontAwesomeIcon icon={faCheck} />
                    Submit
                  </Box>
                </MenuItem>

                <MenuItem disabled={action === ACTION_ADD} onClick={(e) => this.handleActionChange(e, ACTION_ADD)} value={ACTION_ADD}>
                  <Box className={style.menuOption}>
                    <FontAwesomeIcon icon={faPlus} />
                    Add
                  </Box>
                </MenuItem>

                <MenuItem disabled={action === ACTION_REMOVE} onClick={(e) => this.handleActionChange(e, ACTION_REMOVE)} value={ACTION_REMOVE}>
                  <Box className={style.menuOption}>
                    <FontAwesomeIcon icon={faMinus} />
                    Remove
                  </Box>
                </MenuItem>

                <MenuItem color="secondary" onClick={this.undo} variant="contained">
                  <Box className={style.menuOption}>
                    <FontAwesomeIcon icon={faUndo} />
                    Undo
                  </Box>
                </MenuItem>

                <MenuItem color="tertirary" onClick={this.redo} variant="contained">
                  <Box className={style.menuOption}>
                    <FontAwesomeIcon icon={faRedo} />
                    Redo
                  </Box>
                </MenuItem>

                <MenuItem color="secondary" onClick={this.addPolygon} onMouseDown={this.handleDrag(TYPE_POLYGON)} variant="contained">
                  <Box className={style.menuOption}>
                    <FontAwesomeIcon icon={faDrawPolygon} />
                    Add polygon
                  </Box>
                </MenuItem>

                <MenuItem color="tertirary" onClick={this.handleClear} variant="contained">
                  <Box className={style.menuOption}>
                    <FontAwesomeIcon icon={faTrash} />
                    Clear
                  </Box>
                </MenuItem>

                <MenuItem onClick={this.handleDrawerToggle} variant="contained">
                  <Box className={style.menuOption}>
                    <FontAwesomeIcon icon={faList} />
                    Polygons
                  </Box>
                </MenuItem>

                <MenuItem variant="contained">
                  <TextField label='Social distance' min={0} onChange={this.handleInputChange('personRadius')} size="small" type="number" value={personRadius} variant="outlined" />
                </MenuItem>

                <MenuItem variant="contained">
                  <TextField label='Barrier size' min={0} onChange={this.handleInputChange('barrierSize')} size="small" type="number" value={barrierSize} variant="outlined" />
                </MenuItem>

              </Menu>
            </Box>
          </Hidden>

          <Drawer
            anchor='right'
            onClose={this.handleDrawerToggle}
            open={polygonsOpen}
          >
            <List className={style.polygonsList}>
              {!Object.values(polygons).length && <ListItem ><ListItemText>No polygons</ListItemText></ListItem>}
              {Object.values(polygons).map((poly, i) => {
                return (
                  <ListItem button dense key={i} onClick={() => this.handlePolygonListClick(poly)}>
                    <ListItemText primary={`Polygon ${i + 1}`} />
                    <ListItemSecondaryAction onClick={() => this.deletePoly(poly)}>
                      <IconButton>
                        <FontAwesomeIcon icon={faTrash} size='xs' />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          </Drawer>

        </Box>
        <Paper className={style.map} >
          <div ref={(ref) => (this.mapRef = ref)} />
        </Paper>
        <Snackbar autoHideDuration={3000} onClose={() => this.setState({ error: null })} open={!!error}>
          <Alert elevation={6} onClose={() => this.setState({ error: null })} severity="error" variant="filled">
            {error}
          </Alert>
        </Snackbar>
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
