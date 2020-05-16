import { GOOGLE_API_KEY } from '../constants/keys';

class GoogleApi {

    static resolvers = [];
    static onLoad = () => {
      while(this.resolvers.length) {
        const resolve = this.resolvers.shift();
        resolve(window.google);
      }
    }

    static loadApi = async () => {
      const promise = new Promise((resolve) => {
        this.resolvers.push(resolve);
      });

      if(window.google) {
        this.onLoad();
        return promise;
      }

      if(this.resolvers.length === 1) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
        document.head.append(script);
        script.addEventListener('load', this.onLoad);
      }
      return promise;
    }

}

export default GoogleApi.loadApi;
