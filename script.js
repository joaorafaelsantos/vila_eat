/* ---------------------- */
/* 1 - FIREBASE SNIPPET  */
/* ---------------------- */

var config = {
    apiKey: "AIzaSyBcaJGStUhssuTL4q6t-c7489ZKcUmLeWk",
    authDomain: "vilaeat.firebaseapp.com",
    databaseURL: "https://vilaeat.firebaseio.com",
    storageBucket: "vilaeat.appspot.com",
    messagingSenderId: "774767289506"
};
firebase.initializeApp(config);

/* ------------------------------- */
/* 2 - VILA EAT - PARTE PRINCIPAL  */
/* ------------------------------- */

$(function () {
    //TOGGLE DA NAVBAR (RESPONSIVO)
    function navbarResponsive() {
        if ($('.myTopnav').attr('class') == "topnav") {
            $('.myTopnav').toggleClass('topnav responsive');
        } else {
            $('.myTopnav').toggleClass('topnav topnav');
        }
    }
    //VERIFICA SE O UTILIZADOR ESTÁ LOGADO
    firebase.auth().onAuthStateChanged(function (user) {
        //SE O UTILIZADOR ESTIVER LOGADO ABRE A PÁGINA PRINCIPAL
        if (user) {
            //VARIÁVEIS GLOBAIS DEFAULT
            var map; //MAPA DA GOOGLE
            var pos; //OBJETO COM LATITUDES E LONGITUDES
            var isLoad = false; //FLAG PARA VERIFICAR SE O LOAD FOI FEITO
            var zoom; //ZOOM DO MAPA DA GOOGLWE
            var restaurantes = []; //CONTÉM DADOS DE TODOS OS RESTAURANTES
            var restaurantesPontuacao; //CONTÉM DADOS DE TODOS OS RESTAURANTES (EXCEPTO OS QUE NÃO TÊM PONTUAÇÃO)
            var tempRestaurantes = []; //CONTÉM DADOS DE TODOS OS RESTAURANTES FILTRADOS
            var isIPAD; //FLAG DE VERIFICAÇÃO SE O DISPOSITIVO É IPAD (AJUSTAR RESPONSIVIDADE)
            var restaurantesFirebase; //CONTÉM DADOS DOS RESTAURANTES EXISTENTES DA DATABASE DA FIREBASE
            var tiposComida = []; //CONTÉM TODOS OS TIPOS DE COMIDA EXISTENTES
            var isSmartphoneIPAD; //FLAG DE VERIFICAÇÃO SE O DISPOSITIVO É SMARTPHONE OU IPAD PARA ABRIR DIV MAPA AO CARREGAR NO BTN DE OBTER DIREÇÕES
            //GUARDA NO ARRAY OS DADOS DA FIREBASE
            var ref = firebase.database().ref();
            ref.on("value", function (snapshot) {
                restaurantesFirebase = snapshot.val().results.slice();
            }, function (error) {
                console.log("Error: " + error.code);
            });
            //SVG DE LOADING (ANIMAÇÃO)
            $("body").css("visibility", "hidden");
            $("body").prepend("<div id='loading' class='vertical-center' style='display: flex; justify-content: center; align-items: center;'><img id='loading' class='img-responsive center-block' src='images/loading.svg' alt='Loading'></div>");
            $("#loading").css("visibility", "visible");
            //ALIMENTA O SELECT COM OS TIPOS DE COMIDA EXISTENTES NO ARRAY
            function addSelectTiposComida() {
                //tipos de comida
                $('.selectpicker').selectpicker();
                for (i = 0; i < tiposComida.length; i++) {
                    var option = "<option>" + tiposComida[i] + "</option>"
                    $('.selectpicker').append(option)
                }
                $('.selectpicker').selectpicker('refresh');
            }
            //FUNÇÃO QUE FAZ O CARREGAMENTO DA TOTAL PÁGINA
            function load() {
                $("#loading").remove();
                $("body").css("visibility", "visible");
                if (isLoad == false) {
                    //ADICIONA AO ARRAY DOS RESTAURANTES TODA A INFORMAÇÃO DO ARRAY QUE CONTINHA DADOS DA FIREBASE
                    for (var i = 0; i < restaurantes.length; i++) {
                        for (var j = 0; j < restaurantesFirebase.length; j++) {
                            if (restaurantes[i].place_id == restaurantesFirebase[j].placeid) {
                                var tempObj = restaurantes[i];
                                tempObj.facebook = restaurantesFirebase[j].facebook;
                                tempObj.tipo_comida = restaurantesFirebase[j].tipo_comida;
                                restaurantes.splice(i, 1, tempObj)
                            }
                        }
                    }
                    //FUNÇÃO QUE OBTÉM AS DISTÂNCIAS DOS RESTAURANTES DO PONTO DEFINIDO (NAU QUINHENTISTA OU LOCALIZAÇÃO DO UTILIZADOR) E GUARDA NUM ARRAY
                    function obterDistancia(array) {
                        for (var i = 0; i < array.length; i++) {
                            var inicial = new google.maps.LatLng(pos.lat, pos.lng);
                            var final = new google.maps.LatLng(array[i].geometry.location.lat(), array[i].geometry.location.lng());
                            var distance = (google.maps.geometry.spherical.computeDistanceBetween(inicial, final) / 1000).toFixed(2);
                            var tempObj = restaurantes[i];
                            tempObj.distancia = distance;
                            restaurantes.splice(i, 1, tempObj)
                        }
                    }
                    //FUNÇÃO QUE OBTÉM OS TIPOS DE COMIDA DOS RESTAURANTES TOTAL, ELIMINANDO OS REPETIDOS E ORDENANDO O ARRAY (SERVIRÁ PARA ALIMENTAR O SELECT DE TIPOS DE COMIDA)
                    function obterTiposComida(array) {
                        var tempTiposComida = [];
                        for (var i = 0; i < array.length; i++) {
                            if (typeof array[i].tipo_comida != "undefined") {
                                for (var j = 0; j < array[i].tipo_comida.length; j++) {
                                    tempTiposComida.push(array[i].tipo_comida[j])
                                }
                            }
                        }
                        $.each(tempTiposComida, function (i, el) {
                            if ($.inArray(el, tiposComida) === -1) tiposComida.push(el);
                        });

                        function compare(a, b) {
                            if (a.name < b.name)
                                return -1;
                            if (a.name > b.name)
                                return 1;
                            return 0;
                        }
                        tiposComida.sort();
                    }
                    obterDistancia(restaurantes);
                    obterTiposComida(restaurantes);
                    ordenarNome();
                    addSelectTiposComida();
                    isLoad = true;
                }
            }
            //EXECUTA A FUNÇÃO DE LOAD APÓS 5 SEGUNDOS
            setInterval(load, 5000);

            function limparRotas(valor) {
                if (valor != null) {
                    valor.setMap(null);
                    valor = null;
                }
            }
            //FUNÇÃO QUE EXECUTA OS FILTROS
            function filtrarRestaurantes() {
                var valoresTipoComida = $('select').val();
                var restaurantesAbertos = $('#checkRestaurantesAbertos').prop('checked');
                var valorDistancia = $('#inputDistancia').val();
                if (valoresTipoComida.length == 0) {
                    //SWEETALERT CASO NÃO INSIRA TIPO DE COMIDA
                    swal({
                        title: 'Vila Eat\nWhere to Eat!',
                        text: 'Insira um tipo de comida.',
                        type: 'error',
                        timer: 2000
                    }).then(
                        function () {},
                        function (dismiss) {
                            if (dismiss === 'timer') {}
                        }
                    )
                } else {
                    for (var i = 0; i < restaurantes.length; i++) {
                        if (typeof restaurantes[i].tipo_comida != "undefined" && typeof restaurantes[i].opening_hours != "undefined") {
                            if (restaurantes[i].tipo_comida.indexOf(valoresTipoComida) > -1 && parseFloat(restaurantes[i].distancia) <= valorDistancia && restaurantes[i].opening_hours.open_now == restaurantesAbertos) {
                                tempRestaurantes.push(restaurantes[i]);
                            }
                        }
                    }
                    listarRestaurantes(tempRestaurantes);
                }

            }

            //FUNÇÃO QUE LISTA OS RESTAURANTES COM A INFORMAÇÃO 
            function listarRestaurantes(array) {
                if ($("#cont_lista").length != 0) {
                    $("#cont_lista").remove();
                }
                $("#div_lista").append("<div id='cont_lista' style='width:100%; height:725px; overflow-y: auto; padding-right:10px;'></div>");
                var photo_url = []; //CONTÉM URL DA FOTOGRAFIA DO RESTAURANTE
                var rating = []; //CONTÉM RATING DO RESTAURANTE
                var tipoComida = []; //CONTÉM TIPOS DE COMIDA DO RESTAURANTE
                var arrayBtnEditar = []; //SÓ TEM O BOTÃO EDITAR PARA OS RESTAURANTES QUE NÃO TÊM TIPO DE COMIDA
                var facebook = [];
                var abertoFechado;
                //ADICIONA AO ARRAY O URL DA FOTOGRAFIA DO RESTAURANTE
                for (var i = 0; i < array.length; i++) {
                    if (array[i].photos) {
                        photo_url.push(array[i].photos[0].getUrl({
                            'maxWidth': 90,
                            'maxHeight': 90
                        }));
                    } else {
                        photo_url.push("images/sem_imagem.png")
                    }
                    //ADICIONA AO ARRAY O RATING DO RESTAURANTE
                    if (array[i].rating > 0) {
                        rating.push(array[i].rating);
                    } else {
                        rating.push("-");
                    }
                    //ADICIONA AO ARRAY O LABEL ABERTO OU FECHADO (CONSOANTE HORÁRIO) DO RESTAURANTE
                    if (typeof array[i].opening_hours != "undefined") {
                        if (array[i].opening_hours.open_now == true) {
                            abertoFechado = "<span class='label label-success'>Aberto</span></br>"
                        } else {
                            abertoFechado = "<span class='label label-danger'>Fechado</span></br>"
                        }
                    } else {
                        abertoFechado = "<span class='label label-warning'>Horário desconhecido</span></br>"
                    }
                    //ADICIONA AO ARRAY O TIPO DE COMIDA DO RESTAURANTE
                    if (typeof array[i].tipo_comida != "undefined") {
                        tipoComida.push(array[i].tipo_comida);
                        arrayBtnEditar.push("");
                    } else {
                        tipoComida.push("");
                        arrayBtnEditar.push(" <button id='" + i + "' type='button' class='btn btn-md btn_editar' style='background-color: #00637C; color:white;' data-toggle='modal' data-target='#myModal'>Editar</button>");
                    }
                    //ADICIONA AO ARRAY O FACEBOOK DO RESTAURANTE
                    if (typeof array[i].facebook != "undefined") {
                        facebook.push("</br></br><a href='" + array[i].facebook + "' target='_blank'> <i class='fa fa-facebook-square fa-2x' aria-hidden='true' style='color:#00637C'></i></a>");
                    } else {
                        facebook.push("");
                    }
                    //CRIA NO HTML A LISTA
                    $("#cont_lista").append("<center><div style='width:100%; height:20%; overflow: auto; background-color: #f9f9f9; padding-right:20px; border-width: 1%; border-radius: 2%;  border-style: solid; border-color: #f2f1f1;'><p><b>" + array[i].name + "</b> <span class='label label-default'>" + rating[i] + "</span></p>" + "</span></p>" + abertoFechado + "<span class='label label-info'>" + array[i].distancia + " quilómetros</span></br></br><img class='img-responsive img-rounded' src='" + photo_url[i] + "' style='width:100px; height:100px'></br><p>" + array[i].formatted_address + "</p></br><p>" + tipoComida[i] +
                        facebook[i] + "</p></br><button id='" + i + "' type='button' class='btn btn-md btn_obter_direcoes' style='background-color: #46BCEC; color:white;'>Obter direções</button>" + arrayBtnEditar[i] + "</br></br></div></center></br>");
                }
                //APÓS CARREGAR NO BOTÃO DE OBTER DIREÇÕES, CRIA NO MAPA O SENTIDO DO LOCAL DO UTILIZADOR OU NAU QUINHENTISTA AO RESTAURANTE SELECIONADO
                var directionsDisplay = new google.maps.DirectionsRenderer;
                var directionsService = new google.maps.DirectionsService;
                $(".btn_obter_direcoes").click(function () {
                    //SE FOR SMARTPHONE OU IPAD ABRE A DIV DO MAPA
                    if (isSmartphoneIPAD == true) {
                        mapa();
                    }
                    //POSIÇÃO DO UTILIZADOR OU DA NAU QUINHENTISTA
                    var inicial = {
                        lat: pos.lat,
                        lng: pos.lng
                    };
                    //POSIÇÃO DO RESTAURANTE SELECIONADO
                    var final = {
                        lat: array[this.id].geometry.location.lat(),
                        lng: array[this.id].geometry.location.lng()
                    };
                    //LIMPA ROTAS ANTERIORES (SE CARREGAR EM VÁRIOS RESTAURANTES, POR EXEMPLO)
                    limparRotas(directionsDisplay);
                    //ASSOCIA DIREÇÕES AO MAPA
                    directionsDisplay = new google.maps.DirectionsRenderer({
                        map: map
                    });
                    //DEFINE UM OBJETO REQUEST COM ORIGEM, DESTINO E MODO DE VIAGEM
                    var request = {
                        origin: inicial,
                        destination: final,
                        unitSystem: google.maps.UnitSystem.METRIC,
                        avoidHighways: false,
                        avoidTolls: false,
                        travelMode: google.maps.TravelMode.DRIVING
                    };
                    //PASSA O OBJETO REQUEST AO SERVIÇO DIRECTIONS
                    directionsService = new google.maps.DirectionsService();
                    directionsService.route(request, function (response, status) {
                        if (status == google.maps.DirectionsStatus.OK) {
                            //EXIBE A ROTA NO MAPA
                            directionsDisplay.setDirections(response);
                        }
                    });
                });
                $('.btn_editar').click(function () {
                    var content = "<div class='modal fade' id='myModal' role='dialog'><div class='modal-dialog'><div class='modal-content'><div class='modal-header'><button type='button' class='close' data-dismiss='modal'>&times;</button><center><h4 class='modal-title'>Adicione tipos de comida</h4></center></div><div class='modal-body'><center><select class='selectpicker' multiple title='Selecione o tipo de comida'> </select></center></div><div class='modal-footer'><center><button id='btn_guardar' type='button' class='btn' style='background-color: #46BCEC; color:white;' data-dismiss='modal'>Gravar</button><button type='button' class='btn' style='background-color: #00637C; color:white;' data-dismiss='modal'>Fechar</button></center</div></div></div></div>"
                    $('#cont_lista').append(content);
                    addSelectTiposComida();
                    var temparray = array[this.id];
                    //GRAVA NA FIREBASE O TIPO DE COMIDA SELECIONADO
                    $('#btn_guardar').click(function () {
                        var tipoComidaSelecionado = $(".selectpicker").val();
                        if (temparray.place_id == restaurantesFirebase.placeid) {
                            firebase.database().ref('results').child(10).child("tipo_comida").set(tipoComidaSelecionado);
                        } else {
                            firebase.database().ref('results').child(restaurantesFirebase.length).set({
                                facebook: "",
                                placeid: temparray.place_id,
                                tipo_comida: tipoComidaSelecionado
                            })
                        }

                    })
                });
            }
            //FUNÇÃO QUE ORDENA OS RESTAURANTES POR NOME (ORDEM ALFABÉTICA)
            function ordenarNome() {
                function compare(a, b) {
                    if (a.name < b.name)
                        return -1;
                    if (a.name > b.name)
                        return 1;
                    return 0;
                }
                restaurantes.sort(compare);
                listarRestaurantes(restaurantes);
            }
            //FUNÇÃO QUE ORDENA OS RESTAURANTES POR PONTUAÇÃO (DA MAIS ALTA PARA A MAIS BAIXA)
            function ordenarPontuacoes() {
                restaurantesPontuacao = restaurantes.slice();
                for (var i = 0; i < restaurantesPontuacao.length; i++) {
                    if (restaurantesPontuacao[i].rating === undefined) {
                        restaurantesPontuacao.splice(i, 1);
                    }
                }
                for (var i = 0; i < restaurantesPontuacao.length; i++) {
                    if (restaurantesPontuacao[i].rating === undefined) {
                        restaurantesPontuacao.splice(i, 1);
                    }
                }
                //ordena os restaurantes pela pontuação mais alta
                restaurantesPontuacao.sort(function (a, b) {
                    return parseFloat(b.rating) - parseFloat(a.rating);
                });
                listarRestaurantes(restaurantesPontuacao);
            }
            //FUNÇÃO QUE ORDENA OS RESTAURANTES POR DISTÂNCIA (MAIS PERTO PARA MAIS LONGE)
            function ordenarDistancia() {
                function compare(a, b) {
                    if (a.distancia < b.distancia)
                        return -1;
                    if (a.distancia > b.distancia)
                        return 1;
                    return 0;
                }
                restaurantes.sort(compare);
                listarRestaurantes(restaurantes);
            }

            /* ----------------------------------- */
            /* 2.1 - VILA EAT - SMARTPHONE E IPAD  */
            /* ----------------------------------- */

            //FUNÇÃO QUE GERA DEFINIÕES PARA SMARTPHONE OU IPAD
            function smartphoneIPAD() {
                zoom = 13;
                callMap();
                mapa();
                $('#map').css("visibility", "hidden");
                lista();
            }
            //CSS - CENTRA CONTEÚDO PARA SMARTPHONE OU IPAD
            function cssDefs() {
                $("#container").css("text-align", "center");
                $("#content").css({
                    "width": "90%",
                    "display": "block",
                    "margin-left": "auto",
                    "margin-right": "auto",
                });
            }
            //ESTRUTURAÇÃO DA LISTA EM SMARTPHONE OU IPAD
            function lista() {
                //CONTEÚDO HTML
                $("#container").empty();
                var content = "<button id='btn_filtros' type='button' class='btn btn-info btn-md'>Filtros</button> <button id='btn_mapa' type='button' class='btn btn-info btn-md'>Mapa</button></br></br><div id='content'><form class='form-inline'><div class='form-group'><label id='lbl1'>Ordenar por:</label><select class='form-control input-sm' id='selectOrdenar'><option>Nome (ordem alfabética)</option><option>Distância (perto para longe)</option><option>Pontuação (alta para baixa)</option></select></div></form><div id='div_lista'></div></br></div>"
                $('#container').append(content);
                cssDefs();
                //ABRE A DIV DOS FILTROS
                $("#btn_filtros").click(function () {
                    filtros();
                    addSelectTiposComida();
                });
                //ABRE A DIV DO MAPA
                $("#btn_mapa").click(function () {
                    mapa();
                });
                //ORDENAR A LISTA
                $("#selectOrdenar").on("change", function (ev) {
                    var pos = $('#selectOrdenar').find(":selected").index();
                    if (pos == 0) {
                        if ($("#cont_lista").length != 0) {
                            $("#cont_lista").remove();
                        }
                        ordenarNome();
                    } else if (pos == 1) {
                        ordenarDistancia();
                    } else if (pos == 2) {
                        ordenarPontuacoes();
                    }
                });
            }
            //ESTRUTURAÇÃO DOS FILTROS EM SMARTPHONE OU IPAD
            function filtros() {
                //CONTEÚDO HTML
                $("#container").empty();
                var content = "<div id='content'><form class='form-inline'><div class='form-group'><label id='lblComida'>Tipo de Comida:</label> <select class='selectpicker' title='Selecione o tipo de comida'> </select></div></form></br> <form class='form-inline'><div class='form-group'><input id='checkRestaurantesAbertos' type='checkbox'> <label id='lblRestauranteAberto'>Restaurantes Abertos</label></div></form></br><form class='form-inline'><div class='form-group'><label id='lblDistancia'>Distância Máxima:</label></br><input id='inputDistancia' type='text' data-slider-min='1' data-slider-max='20' data-slider-step='1' data-slider-value='20'/></div></form><button id='btn_aplicar' type='button' class='btn btn-info btn-md'>Aplicar</button></div>"
                $('#container').append(content);
                //SLIDER DISTÂNCIA
                $("#inputDistancia").bootstrapSlider({
                    tooltip: 'always'
                });
                cssDefs();
                //APLICAR OS FILTROS
                $("#btn_aplicar").click(function () {
                    filtrarRestaurantes();
                    lista();
                    listarRestaurantes(tempRestaurantes);
                });
            }
            //ESTRUTURAÇÃO DO MAPA EM SMARTPHONE OU IPAD
            function mapa() {
                //CONTEÚDO HTML
                $("#container").empty();
                //SE O MAPA NÃO EXISTIR CRIA
                if ($("#map").length == 0) {
                    var content = "<button id='btn_filtros' type='button' class='btn btn-info btn-md'>Filtros</button> <button id='btn_lista' type='button' class='btn btn-info btn-md'>Lista</button></br></br>"
                    $('#container').append(content);
                    var content2 = "<div id='map'></div><script src='https://maps.googleapis.com/maps/api/js?key=AIzaSyDksiu28z76jeFRqmi3ht6-NjOqvSedOa4&libraries=geometry,places&callback=initMap'async defer></script>"
                    $('#container').after(content2);
                    //VISTA PORTRAIT OU LANDSCAPE - AJUSTA AS DIMENSÕES DO MAPA (RESPONSIVIDADE)
                    //PORTRAIT
                    if (window.matchMedia("(orientation: portrait)").matches || isIPAD == true) {
                        $("#map").css({
                            "width": "80%",
                            "height": "65%"
                        });
                        //LANDSCAPE
                    } else if (window.matchMedia("(orientation: landscape)").matches && isIPAD != true) {
                        $("#map").css({
                            "width": "80%",
                            "height": "40%"
                        });
                    }
                    //CSS - ESTRUTURA O HTML E O BODY
                    $("html, body").css({
                        "height": "100%",
                        "margin": "0",
                        "padding": "0"
                    });
                    //SE O MAPA JÁ EXISTIR ATIVA VISIBILIDADE
                } else {
                    var content = "<button id='btn_filtros' type='button' class='btn btn-info btn-md'>Filtros</button> <button id='btn_lista' type='button' class='btn btn-info btn-md'>Lista</button></br></br>"
                    $('#container').append(content);
                    $('#map').css("visibility", "visible");
                }
                //ABRE A DIV DOS FILTROS
                $("#btn_filtros").click(function () {
                    $('#map').css("visibility", "hidden");
                    filtros();
                    addSelectTiposComida();
                });
                //ABRE A DIV DA LISTA
                $("#btn_lista").click(function () {
                    $('#map').css("visibility", "hidden");
                    lista();
                    ordenarNome();
                });
            }

            /* ------------------------- */
            /* 2.2 - VILA EAT - DESKTOP  */
            /* ------------------------- */

            //FUNÇÃO QUE GERA DEFINIÕES PARA SMARTPHONE OU IPAD
            function desktop() {
                zoom = 14;
                callMap();
                //CONTEÚDO HTML
                $("#container").empty();
                var content = "<div class='content'><div class='row'><div id='div_filtros' class='col-lg-4'><center></br></br><div id='content' style='width:85%; height:275px; background-color: #f9f9f9; border-width: 1%; border-radius: 2%;  border-style: solid; border-color: #f2f1f1;'><form class='form-inline'><div class='form-group'></br><label id='lblComida'>Tipo de Comida:</label> </br><select class='selectpicker' title='Selecione o tipo de comida'> </select></div></form></br><form class='form-inline'><div class='form-group'><input id='checkRestaurantesAbertos' type='checkbox'> <label id='lblRestauranteAberto'>Restaurantes Abertos</label></div></form></br><form class='form-inline'><div class='form-group'><label id='lblDistancia'>Distância Máxima:</label></br><input id='inputDistancia' type='text' data-slider-min='1' data-slider-max='20' data-slider-step='1' data-slider-value='20'/></div></form></br><button id='btn_aplicar' type='button' class='btn btn-info btn-md'>Aplicar</button></br></div></div></center><div id='div_lista'class='col-lg-4'><center><div id='content'><form class='form-inline'><div class='form-group'><label id='lblOrdenar'>Ordenar por:</label> <select class='form-control input-sm' id='selectOrdenar'><option>Nome (ordem alfabética)</option><option>Distância (perto para longe)</option><option>Pontuação (alta para baixa)</option></select></div></form></div></center></br></div><div class='col-lg-4'><center></br></br><div id='map'></div></center></div></div></div>";
                $('#container').append(content);
                //SLIDER DISTÂNCIA
                $("#inputDistancia").bootstrapSlider({
                    tooltip: 'always'
                });
                //CONTEÚDO HTML
                var content2 = "<script src='https://maps.googleapis.com/maps/api/js?key=AIzaSyDksiu28z76jeFRqmi3ht6-NjOqvSedOa4&libraries=geometry,places&callback=initMap'async defer></script>";
                $('#container').after(content2);
                //CSS - CONTAINER E CONTENT
                $("#container").css({
                    "display": "flex",
                    "align-items": "center",
                    "justify-content": "center"
                });
                $(".content").css({
                    "width": "70%"
                });
                //CSS - MAPA
                $("#map").css({
                    "width": "80%",
                    "height": "550px",
                    "border-width": "1%",
                    "border-radius": "2%",
                    "border-style": "solid",
                    "border-color": "#f2f1f1"
                });
                //CSS - BLOQUEAR SCROLL HORIZONTAL
                $("html, body").css({
                    "max-width": "100%",
                    "overflow-x": "hidden"
                });
                //PUBLICIDADE
                $("#content").after("</br><div><img src='images/ad.jpg' alt='ad' style='width:85%; height:250px; border-width: 1%; border-radius: 2%;  border-style: solid; border-color: #f2f1f1;'></div></br><div><img src='images/ad2.jpg' alt='ad2' style='width:85%; height:200px; border-width: 1%; border-radius: 2%;  border-style: solid; border-color: #f2f1f1;'></div>");
                $("#map").after("</br><div><img src='images/ad3.jpg' alt='ad3' style='width:80%; height:175px; border-width: 1%; border-radius: 2%;  border-style: solid; border-color: #f2f1f1;'></div>");
                //FILTRAR RESTAURANTES
                $("#btn_aplicar").click(function () {
                    filtrarRestaurantes();
                });
                //ORDENAR A LISTA
                var pos = $('#selectOrdenar').find(":selected").index();
                $("#selectOrdenar").on("change", function (ev) {
                    var pos = $('#selectOrdenar').find(":selected").index();
                    if (pos == 0) {
                        if ($("#cont_lista").length != 0) {
                            $("#cont_lista").remove();
                        }
                        ordenarNome();
                    } else if (pos == 1) {
                        ordenarDistancia();
                    } else if (pos == 2) {
                        ordenarPontuacoes();
                    }
                });
            }

            /* -------------------------------------- */
            /* 3 - VERIFICAÇÃO DE TIPO DE DISPOSITIVO */
            /* -------------------------------------- */

            //VERIFICA SE É SMARTPHONE
            if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                isSmartphoneIPAD = true;
                $('#content').css("width", "90%");
                $('#content').css("height", "90%");
                smartphoneIPAD();
            }
            //VERIFICA SE É IPAD
            else if (/IPAD/i.test(navigator.userAgent)) {
                isSmartphoneIPAD = true;
                isIPAD = true;
                smartphoneIPAD();
            }
            //VERIFICA SE É DESKTOP
            else {
                desktop();
            }

            /* ------------------- */
            /* 4 - GOOGLE MAPS API */
            /* ------------------- */

            //CARREGA A GOOGLE MAPS API
            function callMap() {
                var infowindow;
                window.initMap = function initMap() {
                    //POSIÇÕES DA NAU QUINHENTISTA
                    pos = {
                        lat: 41.349946,
                        lng: -8.743358
                    };
                    map = new google.maps.Map(document.getElementById('map'), {
                        //ESTILO DO MAPA
                        center: pos,
                        zoom: zoom,
                        styles: [{
                            "featureType": "administrative",
                            "elementType": "labels.text.fill",
                            "stylers": [{
                                "color": "#444444"
                            }]
                        }, {
                            "featureType": "landscape",
                            "elementType": "all",
                            "stylers": [{
                                "color": "#f2f2f2"
                            }]
                        }, {
                            "featureType": "poi",
                            "elementType": "all",
                            "stylers": [{
                                "visibility": "off"
                            }]
                        }, {
                            "featureType": "road",
                            "elementType": "all",
                            "stylers": [{
                                "saturation": -100
                            }, {
                                "lightness": 45
                            }]
                        }, {
                            "featureType": "road.highway",
                            "elementType": "all",
                            "stylers": [{
                                "visibility": "simplified"
                            }]
                        }, {
                            "featureType": "road.arterial",
                            "elementType": "labels.icon",
                            "stylers": [{
                                "visibility": "off"
                            }]
                        }, {
                            "featureType": "transit",
                            "elementType": "all",
                            "stylers": [{
                                "visibility": "off"
                            }]
                        }, {
                            "featureType": "water",
                            "elementType": "all",
                            "stylers": [{
                                "color": "#46bcec"
                            }, {
                                "visibility": "on"
                            }]
                        }]
                    });
                    infowindow = new google.maps.InfoWindow();
                    var service = new google.maps.places.PlacesService(map);
                    //QUERY DE PROCURA
                    service.textSearch({
                        query: 'restaurantes em vila do conde'
                    }, callback);
                    //GEOLOCALIZAÇÃO
                    //PERMISSÃO ACEITE
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(function (position) {
                            lat = position.coords.latitude,
                                lng = position.coords.longitude
                            geocoder = new google.maps.Geocoder();
                            var latlng = new google.maps.LatLng(lat, lng);
                            geocoder.geocode({
                                'latLng': latlng
                            }, function (results, status) {
                                //VERIFICA A CIDADE ONDE ESTÁ O UTILIZADOR, CASO ESTEJA EM VILA DO CONDE CENTRA NO LOCAL ONDE ESTÁ, CASO NÃO ESTEJA CENTRA NA NAU QUINHENTISTA
                                if (status == google.maps.GeocoderStatus.OK) {
                                    if (results[1]) {
                                        for (var i = 0; i < results[2].address_components.length; i++) {
                                            for (var b = 0; b < results[2].address_components[i].types.length; b++) {
                                                if (results[2].address_components[i].types[b] == "administrative_area_level_2") {
                                                    city = results[2].address_components[i];
                                                    break;
                                                }
                                            }
                                        }
                                        if (city.short_name == "Vila do Conde") {
                                            pos = {
                                                lat: position.coords.latitude,
                                                lng: position.coords.longitude
                                            };
                                            map.setCenter(pos);
                                        }
                                    } else {
                                        console.log("No results found");
                                    }
                                }
                            });
                            //PERMISSÃO RECUSADA - CENTRA NA NAU QUINHENTISTA
                        }, function () {
                            pos = {
                                lat: 41.349946,
                                lng: -8.743358
                            };
                            map.setCenter(pos);
                        });
                    } else {
                        //BROWSER NÃO SUPORTA GEOLOCALIZAÇÃO
                        handleLocationError(false, infoWindow, map.getCenter());
                    }
                }
                //GUARDA AS INFORMAÇÕES DOS RESTAURANTES DA GOOGLE PLACES NUM ARRAY
                function callback(results, status, pagination) {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        //COMO A API DEVOLVE 20 RESULTADOS, O SEGUINTE MÉTODO "APANHA" TODAS AS PÁGINAS E GUARDA NO ARRAY OS DADOS TOTAIS
                        if (pagination.hasNextPage) {
                            pagination.nextPage();
                            for (var i = 0; i < results.length; i++) {
                                createMarker(results[i]); //CRIA OS MARKERS
                                restaurantes.push(results[i]);
                            }
                        }
                    }
                }
                function createMarker(place) {
                    console.log("entrei")
                    var placeLoc = place.geometry.location;
                    var marker = new google.maps.Marker({
                        map: map,
                        position: place.geometry.location,
                        icon: "entrei"+'images/favicon2.ico' //ICON DO GARFO NO MAPA
                    });
                    //INFORMAÇÃO DA INFOWINDOW (NOME DO RESTAURANTE, MORADA E RATING)
                    google.maps.event.addListener(marker, 'click', function () {
                        infowindow.setContent('<div><strong>' + place.name + '</strong></br>' + place.formatted_address + "</br>" + place.rating + '</div>');
                        infowindow.open(map, this);
                    });
                }
            }
            //SE O UTILIZADOR NÃO ESTIVER LOGADO REDIRECIONA PARA A PÁGINA DE LOGIN
        } else {
            window.location.href = "index.html";
        }
    });
});