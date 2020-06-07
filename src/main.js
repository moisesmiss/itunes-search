Vue.use(Vuex);
// Date Format //
Vue.filter('formatDate', function(d) {
	if(!window.Intl) return d;
	return new Intl.DateTimeFormat('el-GR').format(new Date(d));
})


let store = new Vuex.Store({
	state: {
		songs: null,
		loading: false,
		page: 1,
		songs_per_page: 50,
		term: '',
	},
	getters: {
		songsFiltered(state){
			if(state.songs != null){
				return state.songs;
				return state.songs.filter(song => song.trackNumber > 4);
			} else {
				return null;
			}
		}
	},
	mutations: {
		setSongs(state, songs){
			state.songs = songs;
		},
		changeLoading(state, value){
			state.loading = value;
		},
		setTerm(state, value){
			state.term = value;
		},
		setPage(state, page){
			state.page = page;
		}
	},
	actions: {
		async getSongs({commit, state}, payload){
			try {
				let params = {
					term: encodeURIComponent(state.term),
					country: 'MX',
					offset: (state.page * state.songs_per_page) - state.songs_per_page,
					limit: state.songs_per_page,
					media: 'music',
				};
				let headers = {
					'Access-Control-Allow-Origin' : '*',
      				'Access-Control-Allow-Methods' : 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
				}
				commit('changeLoading', true);
				let {data: {results: songs}} = await axios.get(`https://itunes.apple.com/search`, {params, headers});
				commit('setSongs', songs);
				return songs;
			} catch (error) {
				console.log(error);
			} finally {
				commit('changeLoading', false);
			}
		}
	},
});

let paginationSearch = {
	template: /*html*/
	`
	<nav aria-label="Page navigation example" v-if="songsFiltered && !loading" :class="{'d-none': page == 1 && songs.length < songs_per_page}">
		<ul class="pagination justify-content-center">
			<li class="page-item" :class="{'disabled': page == 1}">
				<button class="page-link" :disabled="page == 1" @click="changePage(page - 1)"><i class="fas fa-arrow-left"></i></button>
			</li>
			<li class="page-item" :class="{'disabled': songs != null && songs.length < songs_per_page}">
				<button class="page-link"><i class="fas fa-arrow-right" @click="changePage(page + 1)"></i></button>
			</li>
		</ul>
	</nav>
  `,
  methods: {
	changePage(page){
		this.setPage(page);
		this.getSongs();
	},
	...Vuex.mapMutations(['setPage']),
	...Vuex.mapActions(['getSongs']),
  },
  computed: {
	  ...Vuex.mapState(['loading', 'page', 'songs_per_page', 'songs']),
	  ...Vuex.mapGetters(['songsFiltered']),
  },
};

let searchForm = {
	template: /*html*/
	`
	<form @submit.prevent="search">
		<div class="form-row">
			<div class="col">
				<div class="input-group">
					<input ref="input" v-model="term" type="search" class="form-control" placeholder="Ej. Rihanna">
					<div class="input-group-append">
						<button class="btn btn-primary"><i class="fa fa-search"></i></button>
					</div>
				</div>
			</div>
		</div>
		<div class="row" v-show="!loading">
			<div class="col-12">
				<p v-if="songsFiltered != null && !songsFiltered.length" class="my-2">No se encontraron canciones para la búsqueda.</p>
				<p v-if="songsFiltered != null && songsFiltered.length" class="my-2 badge badge-secondary">Resultados: {{songsFiltered.length}}</p>
			</div>
		</div>
	</form>
	`,
	data(){
		return {
			term: '',
		}
	},
	computed: {
		...Vuex.mapState(['loading']),
		...Vuex.mapGetters(['songsFiltered'])
	},
	methods: {
		...Vuex.mapActions(['getSongs']),
		...Vuex.mapMutations(['setTerm', 'setPage']),
		search: function() {
			let audios = document.querySelectorAll('audio');
			this.$refs.input.blur(); 
			audios.forEach(item => item.pause());
			this.setTerm(this.term);
			this.setPage(1);
			this.getSongs();

		},
	},
};

let songTeaser = {
	template: /*html*/
	`
	<div class="h-100 card song">
		<div class="row no-gutters">
			<div class="col-auto d-flex flex-column">
				<a :href="song.trackViewUrl" target="_blank" class="d-inline-block">
					<img  class="card-img-left" :src="song.artworkUrl100">
				</a>
			</div>
			<div class="col">
				<div class="px-2 py-1 d-flex flex-column h-100">

					<h6 class="mb-0"><a :href="song.trackViewUrl" target="_blank">{{song.trackName}}</a></h6>
					<div>
						<span class="badge badge-primary"><i class="fas fa-microphone-alt"></i> {{song.artistName}}</span>
						<small class="badge badge-light"><i class="fas fa-record-vinyl"></i> {{song.collectionName}}</small>
					</div>
					<audio ref="audio" :src="song.previewUrl"></audio>
					<div class="row no-gutters mx-n1 pt-1 mt-auto">
						<div class="col px-1">
							<button
							class="btn btn-sm btn-block" 
							:class="{'btn-primary': !paused, 'btn-outline-primary': paused}" @click="play">
								<i v-show="paused" class="fas fa-play"></i>
								<i v-show="!paused && !loading" class="fas fa-pause"></i>
								<i v-show="!paused && loading" class="fas fa-spinner fa-spin"></i>
								{{paused ? 'Reproducir' : 'Pausar'}}
							</button>
						</div>
						<div class="col px-1">
							<a :href="song.trackViewUrl" target="_blank" class="btn btn-sm btn-outline-dark btn-block">
								<i class="fab fa-apple"></i> Ver en itunes
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="image-info row no-gutters py-1 position-relative flex-fill d-flex align-items-center">
			<div class="progress" ref="progress"></div>
			<div class="col px-1">
				<small><i class="fas fa-music"></i> {{song.primaryGenreName}}</small>
			</div>
			<div class="col-auto px-1">
				<small><i class="fas fa-calendar-alt"></i> {{song.releaseDate|formatDate}}</small>
			</div>
		</div>
	</div>
	`,
	props: ['song'],
	data(){
		return {
			paused: true,
			currentTime: null,
			duration: null,
			buffered: null,
			loading: false,
			progress: 0,
		};
	},
	mounted() {
		this.$refs.audio.addEventListener('play', (event) => {
			let audios = document.querySelectorAll('audio');
			audios.forEach(item => {
				if(item != event.target)item.pause()
			});
			this.paused = false;
		});
		this.$refs.audio.addEventListener('pause', (event) => {
			this.paused = true;
		});
		this.$refs.audio.addEventListener('waiting', (event) => {
			this.loading = true;
		});
		this.$refs.audio.addEventListener('canplay', (event) => {
			this.loading = false;
		});
		setInterval(() => {
			let audio = this.$refs.audio;
			if(audio == undefined) return;
			this.currentTime = audio.currentTime.toFixed(2);
			this.duration = audio.duration;
			this.buffered = audio.played;
			this.getProgress();
		},1000);
	},
	methods: {
		play(){
			if(this.paused) this.$refs.audio.play();
			else this.$refs.audio.pause();
		},
		getProgress(){
			let audio = this.$refs.audio;
			this.progress = 100 / audio.duration * audio.currentTime;
			this.progress = parseFloat(this.progress.toFixed(2));
			this.$refs.progress.style.width = `${this.progress}%`;
		}
	},
	computed: {
	},
}; 
  
// Search App //
const app = new Vue({
	el: "#app",
	store,
	components: {songTeaser, searchForm, paginationSearch},
	computed: {
		...Vuex.mapState(['loading']),
		...Vuex.mapGetters(['songsFiltered']),
	},
});
