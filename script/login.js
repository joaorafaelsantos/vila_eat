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

/* ----------- */
/* 2 - LOGIN  */
/* ----------- */

$(function () {
    //VERIFICA SE O UTILIZADOR ESTÁ LOGADO
    firebase.auth().onAuthStateChanged(function (user) {
        //SE O UTILIZADOR ESTIVER LOGADO REDIRECIONA PARA A PÁGINA PRINCIPAL
        if (user) {
            window.location.href = "main.html";
            //SE O UTILIZADOR NÃO ESTIVER LOGADO REALIZA A AUTENTICAÇÃO
        } else {

            /* ------------------------------------- */
            /* 2.1 - LOGIN - FORM'S DE AUTENTICAÇÃO  */
            /* ------------------------------------- */

            //FORM DE INICIAR SESSÃO
            function iniciarSessao() {
                $('#div_form').empty(); //LIMPA O FORM DE LOGIN
                //CONTEÚDO HTML - INICIAR SESSÃO
                var content = " <form onsubmit='return false'><div class='form-group'><input type='email' class='input-lg form-control' id='email' placeholder='E-mail' required></div><div class='form-group'><input type='password' class='input-lg form-control' id='password' placeholder='Palavra-passe' required></div><button id='btn_login' type='submit' class='btn btn-info btn-lg btn-block'>Iniciar sessão</button></br></br><button id='btn_criarConta' type='button' class='btn btn-link btn-xs'>Criar conta</button></br><button id='btn_recPassword' type='button' class='btn btn-link btn-xs'>Esqueci-me da palavra-passe</button></form>"
                $('#div_form').append(content);
                $('#email').focus();
                //ABRE A DIV DE REGISTO AO CARREGAR EM CRIAR CONTA
                $('#btn_criarConta').click(function () {
                    registarConta();
                });
            }
            //FORM DE REGISTO DE CONTA
            function registarConta() {
                $('#div_form').empty(); //LIMPA O FORM DE LOGIN
                //CONTEÚDO HTML - REGISTO DE NOVA CONTA
                var content = " <form onsubmit='return false'><div class='form-group'><input type='email' class='input-lg form-control' id='email' placeholder='E-mail' required></div><div class='form-group'><input type='password' class='input-lg form-control' id='password' placeholder='Palavra-passe' required></div><div class='form-group'><input type='password' class='input-lg form-control' id='password2' placeholder='Repita a Palavra-passe' required></div><button id='btn_registo' type='submit' class='btn btn-info btn-lg btn-block'>Criar conta</button></br><button id='btn_iniciarSessao' type='button' class='btn btn-link btn-xs'>Tens uma conta? Inicia sessão</button></form>"
                $('#div_form').append(content);
                $('#email').focus();
                //ABRE A DIV DE REGISTO AO CARREGAR EM INICIAR SESSÃO
                $('#btn_iniciarSessao').click(function () {
                    iniciarSessao();
                    init();
                });
            }
            //FORM DE RECUPERAÇÃO DE CONTA
            function recuperarConta() {
                $('#div_form').empty(); //LIMPA O FORM DE LOGIN
                //CONTEÚDO HTML - RECUPERAÇÃO DE CONTA
                var content = " <form onsubmit='return false'><div class='form-group'><input type='email' class='input-lg form-control' id='email' placeholder='E-mail' required></div><div class='form-group'><div class='form-group'><button id='btn_recConta' type='submit' class='btn btn-info btn-lg btn-block'>Recuperar conta</button></br></br><button id='btn_criarConta' type='button' class='btn btn-link btn-xs'>Criar conta</button></br><button id='btn_iniciarSessao' type='button' class='btn btn-link btn-xs'>Tens uma conta? Inicia sessão</button></form>"
                $('#div_form').append(content); //adiciona o form à div 'form' do html
                $('#email').focus(); //foca no campo e-mail
                //ABRE A DIV DE REGISTO AO CARREGAR EM CRIAR CONTA
                $('#btn_criarConta').click(function () {
                    registarConta();
                });
                //ABRE A DIV DE REGISTO AO CARREGAR EM INICIAR SESSÃO
                $('#btn_iniciarSessao').click(function () {
                    iniciarSessao();
                    init();
                });
            }

            /* ---------------------------------------------- */
            /* 2.2 - LOGIN - EVENTOS DE AUTENTICAÇÃO/ALERT'S  */
            /* ---------------------------------------------- */

            function init() {
                var isPreenchido = false; //FLAG DE VERIFICAÇÃO SE O FORM ESTÁ BEM PREENCHIDO
                //FUNÇÃO DE RESET DA PALAVRA-PASSE E DA PALAVRA-PASSE DE CONFIRMAÇÃO
                function resetValores() {
                    $('#password').val('');
                    $('#password2').val('');
                    $('#password').focus();
                }
                $("#btn_login").click(function () {
                    $('form').submit(function (e) { //VERIFICA SE O FORM ESTÁ BEM PREENCHIDO
                        e.preventDefault();
                        isPreenchido = true;
                    });
                    //VARIÁVEIS EMAIL E PALAVRA-PASSE
                    var email = $("#email").val();
                    var password = $("#password").val();
                    //FUNÇÃO DE RESET DA PALAVRA-PASSE E DA PALAVRA-PASSE DE CONFIRMAÇÃO
                    function resetValores() {
                        $('#email').val('');
                        $('#password').val('');
                        $('#email').focus();
                    }
                    //FIREBASE - DADOS DE INICIAR SESSÃO CORRETOS
                    firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
                        swal({ //sweetalert
                            title: 'Bem-vindo!',
                            text: 'Sessão iniciada com sucesso',
                            type: 'success',
                            timer: 1500
                        }).then(function () { //AO CARREGAR NO OK
                            location.href = "main.HTML";
                        }, function (dismiss) {
                            if (dismiss === 'timer') { //APÓS CONCLUIR O TIMER REDIRECIONA PARA A PÁGINA PRINCIPAL
                                location.href = "main.HTML";
                            }
                        })
                    }, function (error) {
                        //DADOS DE INICIAR SESSÃO INCORRETOS
                        if (isPreenchido == true) { //SE O FORM ESTÁ BEM PREENCHIDO
                            swal({ //sweetalert
                                title: 'Erro!',
                                text: 'Dados incorretos',
                                type: 'error',
                                timer: 1500
                            }).then(function () { //AO CARREGAR NO OK
                                resetValores(); //FUNÇÃO DE RESET
                            }, function (dismiss) {
                                if (dismiss === 'timer') { //APÓS CONCLUIR O TIMER
                                    resetValores(); //FUNÇÃO DE RESET
                                }
                            })
                        }
                    });
                });
                //CARREGAR NO BOTÃO DE CRIAR CONTA
                $('#btn_criarConta').click(function () {
                    registarConta();
                    //CARREGAR NO BOTÃO DE REGISTO
                    $('#btn_registo').click(function () {
                        $('form').submit(function (e) { //VERIFICA SE O FORM ESTÁ BEM PREENCHIDO
                            e.preventDefault();
                            isPreenchido = true;
                        });
                        //VARIÁVEIS EMAIL, PALAVRA-PASSE E PALAVRA-PASSE DE CONFIRMAÇÃO
                        var email = $('#email').val();
                        var password = $('#password').val();
                        var password2 = $('#password2').val();
                        //FORM BEM PREENCHIDO/PALAVRAS-PASSE NÃO NULAS/PALAVRAS-PASSE DIFERENTES
                        if (isPreenchido == true && password != '' && password2 != '' && password != password2) {
                            swal({ //SWEETALERT
                                title: 'Erro!',
                                text: 'As palavras-passe não coincidem',
                                type: 'error',
                                timer: 1500
                            }).then(function () { //AO CARREGAR NO OK
                                resetValores(); //FUNÇÃO DE RESET
                            }, function (dismiss) {
                                if (dismiss === 'timer') { //APÓS CONCLUIR O TIMER
                                    resetValores(); //FUNÇÃO DE RESET
                                }
                            })
                            //FORM BEM PREENCHIDO/PALAVRAS-PASSE NÃO NULAS/PALAVRAS-PASSE DIFERENTES/PALAVRA-PASSE MENOS DE 6 CARACTERES
                        } else if (isPreenchido == true && password != '' && password2 != '' && password == password2 && password.length < 6) {
                            swal({ //SWEETALERT
                                title: 'Erro!',
                                text: 'A palavra-passe tem de ter mais de 6 caracteres',
                                type: 'error',
                                timer: 1500
                            }).then(function () { //AO CARREGAR NO OK
                                resetValores(); //FUNÇÃO DE RESET
                            }, function (dismiss) {
                                if (dismiss === 'timer') { //APÓS CONCLUIR O TIMER
                                    resetValores(); //FUNÇÃO DE RESET
                                }
                            })
                        } else if (isPreenchido == true && password != '' && password2 != '' && password == password2) {
                            //FIREBASE - DADOS DE REGISTO CORRETOS
                            firebase.auth().createUserWithEmailAndPassword(email, password).then(function () {
                                swal({ //SWEETALERT
                                    title: 'Conta criada!',
                                    text: 'Inicie a sessão',
                                    type: 'success',
                                    timer: 1500
                                }).then(function () { //AO CARREGAR NO OK FAZ REFERESH DA PÁGINA
                                    location.reload();
                                }, function (dismiss) {
                                    if (dismiss === 'timer') { //APÓS CONCLUIR O TIMER
                                        location.reload(); //FAZ REFERESH DA PÁGINA
                                    }
                                })
                            }, function (error) {
                                //DADOS DE REGISTO INCORRETOS
                                //EMAIL EXISTENTE
                                swal({ //SWEETALERT
                                    title: 'Erro!',
                                    text: 'O endereço de e-mail já existe',
                                    type: 'error',
                                    timer: 1500
                                }).then(function () { //AO CARREGAR NO OK
                                    $('#email').val(''); //RESET AO EMAIL
                                }, function (dismiss) {
                                    if (dismiss === 'timer') { //APÓS CONCLUIR O TIMER
                                        $('#email').val('') //RESET AO EMAIL
                                    }
                                })
                            });
                        }
                    });
                });
                //CARREGAR NO BOTÃO DE RECUPERAR PALAVRA-PASSE
                $('#btn_recPassword').click(function () {
                    recuperarConta();
                    $('#btn_recConta').click(function () {
                        $('form').submit(function (e) { //VERIFICA SE O FORM ESTÁ BEM PREENCHIDO
                            e.preventDefault();
                            isPreenchido = true;
                        });
                        //VARIÁVEL DE E-MAIL
                        var email = $('#email').val();
                        //FORM ESTÁ BEM PREENCHIDO/E-MAIL NÃO NULO
                        if (isPreenchido == true && email != '') {
                            var auth = firebase.auth();
                            var emailAddress = email;
                            //FIREBASE - DADOS DE RECUPERAÇÃO CORRETOS
                            auth.sendPasswordResetEmail(emailAddress).then(function () {
                                swal({ //SWEETALERT
                                    title: 'Bem-vindo!',
                                    text: 'Foi enviado um e-mail de recuperação para ' + email,
                                    type: 'success',
                                    timer: 2000
                                }).then(function () { //AO CARREGAR NO OK
                                    location.reload(); //FAZ REFERESH DA PÁGINA
                                }, function (dismiss) {
                                    if (dismiss === 'timer') { //APÓS CONCLUIR O TIMER
                                        location.reload(); //FAZ REFERESH DA PÁGINA
                                    }
                                })
                            }, function (error) {
                                //DADOS DE RECUPERAÇÃO INCORRETOS
                                //E-MAIL NÃO EXISTE
                                swal({ //SWEETALERT
                                    title: 'Erro!',
                                    text: 'O endereço de e-mail não existe',
                                    type: 'error',
                                    timer: 1500
                                }).then(function () { //AO CARREGAR NO OK
                                    $('#email').val(''); //RESET AO EMAIL
                                }, function (dismiss) {
                                    if (dismiss === 'timer') { //APÓS CONCLUIR O TIMER
                                        $('#email').val('') //RESET AO EMAIL
                                    }
                                })
                            });
                        }
                    });
                });
            }
            
            /* -------- */
            /* 3 - RUN  */
            /* -------- */

            iniciarSessao(); //INICIA A PÁGINA COM O FORM DE INICIO DE SESSÃO
            init(); //CORRE OS EVENTOS DE AUTENTICAÇÃO/ALERT'S
        }
    });
});