(this.webpackJsonpcovid=this.webpackJsonpcovid||[]).push([[0],{34:function(e,t,n){e.exports={wrapper:"Map_wrapper__3zHlE",map:"Map_map__UaOG-"}},39:function(e,t,n){e.exports={wrapper:"AppLayout_wrapper__2v2AH",content:"AppLayout_content__CczQD"}},45:function(e,t,n){e.exports={wrapper:"Header_wrapper__3tGRg"}},51:function(e,t,n){e.exports=n(66)},56:function(e,t,n){},65:function(e,t,n){},66:function(e,t,n){"use strict";n.r(t);var a=n(0),r=n.n(a),c=n(20),o=n.n(c),l=(n(56),n(29)),i=n(83),u=n(7),s=n(8),p=n(9),m=n(10),f=n(4),h=n(77),d=n(80),v=n(22),b=n(23),E=function(e){Object(m.a)(n,e);var t=Object(p.a)(n);function n(){var e;Object(u.a)(this,n);for(var a=arguments.length,r=new Array(a),c=0;c<a;c++)r[c]=arguments[c];return(e=t.call.apply(t,[this].concat(r))).handleChange=function(t,n){e.props.history.push(n)},e}return Object(s.a)(n,[{key:"render",value:function(){return r.a.createElement(h.a,{onChange:this.handleChange},r.a.createElement(d.a,{label:"Home",value:"/",icon:r.a.createElement(v.a,{icon:b.a,size:"2x"})}),r.a.createElement(d.a,{label:"Map",value:"/map",icon:r.a.createElement(v.a,{icon:b.b,size:"2x"})}),r.a.createElement(d.a,{label:"About",value:"/about",icon:r.a.createElement(v.a,{icon:b.c,size:"2x"})}))}}]),n}(a.Component),O=Object(f.f)(E),j=n(79),g=n(45),w=n.n(g),_=function(e){Object(m.a)(n,e);var t=Object(p.a)(n);function n(){return Object(u.a)(this,n),t.apply(this,arguments)}return Object(s.a)(n,[{key:"render",value:function(){return r.a.createElement(j.a,{className:w.a.wrapper})}}]),n}(a.PureComponent),y=n(24),k=n.n(y),C=n(32),x=Object({NODE_ENV:"production",PUBLIC_URL:"/static",WDS_SOCKET_HOST:void 0,WDS_SOCKET_PATH:void 0,WDS_SOCKET_PORT:void 0}).REACT_APP_GOOGLE_API_KEY,A=function e(){Object(u.a)(this,e)};A.resolvers=[],A.onLoad=function(){for(;A.resolvers.length;){A.resolvers.shift()(window.google)}};var L=A.loadApi=Object(C.a)(k.a.mark((function e(){var t,n;return k.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(t=new Promise((function(e){A.resolvers.push(e)})),!window.google){e.next=4;break}return A.onLoad(),e.abrupt("return",t);case 4:return 1===A.resolvers.length&&((n=document.createElement("script")).src="https://maps.googleapis.com/maps/api/js?key=".concat(x,"&libraries=places"),document.head.append(n),n.addEventListener("load",A.onLoad)),e.abrupt("return",t);case 6:case"end":return e.stop()}}),e)}))),R=n(34),S=n.n(R),N=function(e){Object(m.a)(n,e);var t=Object(p.a)(n);function n(e){var a;return Object(u.a)(this,n),(a=t.call(this,e)).handleMapClick=function(e){var t=e.latLng;console.log(t)},a.state={polygons:[]},a.containerRef=null,a.mapRef=null,a.searchRef=null,a}return Object(s.a)(n,[{key:"componentDidMount",value:function(){var e=this,t=this.props.api.maps;console.log(t),this.map=new t.Map(this.mapRef,{center:{lat:-34.397,lng:150.644},zoom:8}),this.autocomplete=new t.places.Autocomplete(this.searchRef),navigator.geolocation&&navigator.geolocation.getCurrentPosition((function(n){var a=new t.LatLng(n.coords.latitude,n.coords.longitude);e.map.setCenter(a)})),this.map.addListener("click",this.handleMapClick)}},{key:"render",value:function(){var e=this;return r.a.createElement("div",{className:S.a.wrapper,ref:function(t){return e.containerRef=t}},r.a.createElement("div",{className:S.a.toolbar},r.a.createElement("input",{placeholder:"Search..",ref:function(t){return e.searchRef=t},type:"text"})),r.a.createElement("div",{className:S.a.map,ref:function(t){return e.mapRef=t}}))}}]),n}(a.Component),P=Object(a.lazy)(Object(C.a)(k.a.mark((function e(){var t;return k.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,L();case 2:return t=e.sent,e.abrupt("return",{default:function(e){return r.a.createElement(N,Object.assign({},e,{api:t}))}});case 4:case"end":return e.stop()}}),e)})))),z=function(){return r.a.createElement(a.Suspense,{fallback:r.a.createElement(M,null)},r.a.createElement(P,null))},M=function(){return r.a.createElement(v.a,{icon:b.d,size:"2x",spin:!0})},H=function(e){Object(m.a)(n,e);var t=Object(p.a)(n);function n(){return Object(u.a)(this,n),t.apply(this,arguments)}return Object(s.a)(n,[{key:"render",value:function(){return r.a.createElement("div",null,"Home")}}]),n}(a.Component),T=function(e){Object(m.a)(n,e);var t=Object(p.a)(n);function n(){return Object(u.a)(this,n),t.apply(this,arguments)}return Object(s.a)(n,[{key:"render",value:function(){return r.a.createElement("div",null,r.a.createElement(z,null))}}]),n}(a.Component),D=function(e){Object(m.a)(n,e);var t=Object(p.a)(n);function n(){return Object(u.a)(this,n),t.apply(this,arguments)}return Object(s.a)(n,[{key:"render",value:function(){return r.a.createElement("div",null,"About")}}]),n}(a.Component),W=n(39),G=n.n(W),K=function(e){Object(m.a)(n,e);var t=Object(p.a)(n);function n(){return Object(u.a)(this,n),t.apply(this,arguments)}return Object(s.a)(n,[{key:"render",value:function(){return r.a.createElement("div",{className:G.a.wrapper},r.a.createElement(_,null),r.a.createElement("div",{className:G.a.content},r.a.createElement(f.c,null,r.a.createElement(f.a,{path:"/map"},r.a.createElement(T,null)),r.a.createElement(f.a,{path:"/about"},r.a.createElement(D,null)),r.a.createElement(f.a,{path:"/"},r.a.createElement(H,null)))),r.a.createElement(O,null))}}]),n}(a.Component);n(65);var B=function(){return r.a.createElement(l.a,null,r.a.createElement(i.a,{className:"App"},r.a.createElement(K,null)))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));o.a.render(r.a.createElement(r.a.StrictMode,null,r.a.createElement(B,null)),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[51,1,2]]]);
//# sourceMappingURL=main.c7e9c3e4.chunk.js.map