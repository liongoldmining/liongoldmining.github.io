var app = angular.module('accountsApp', ['ngRoute', 'ngResource']);

var baseUrl = "https://liongoldmining-investor.herokuapp.com";

app.config(function ($routeProvider) {

    $routeProvider.when('/cadastro', {
        controller: 'CadastroAccountsController',
        templateUrl: 'templates/cadastro.html'
    }).when('/cadastro/:id', {
        controller: 'CadastroAccountsController',
        templateUrl: 'templates/cadastro.html'
    }).when('/accounts', {
        controller: 'TabelaAccountsController',
        templateUrl: 'templates/accounts.html'
    }).when('/subaccounts/:id', {
        controller: 'SubAccountsController',
        templateUrl: 'templates/subaccounts.html'
    }).when('/accounttransactions/:id', {
        controller: 'TransactionsController',
        templateUrl: 'templates/accounttransactions.html'
    }).when('/cadastrosubaccount/:id', {
        controller: 'CadastroSubAccountsController',
        templateUrl: 'templates/cadastrosubaccount.html'
    }).when('/cadastrosubaccount/:id/:subid', {
        controller: 'CadastroSubAccountsController',
        templateUrl: 'templates/cadastrosubaccount.html'
    }).when('/cadastrotransaction/:subid', {
        controller: 'CadastroTransactionController',
        templateUrl: 'templates/cadastrotransaction.html'
    }).when('/cadastrotransaction/:subid/:tid', {
        controller: 'CadastroTransactionController',
        templateUrl: 'templates/cadastrotransaction.html'
    }).otherwise('/accounts');

});

app.controller('TabelaAccountsController', function ($scope, AccountsService) {

    listar();

    function listar() {
        AccountsService.listar().then(function (accounts) {
            $scope.accounts = accounts;
        });
    }

    $scope.excluir = function (account) {
        AccountsService.excluir(account).then(listar);
    };
});

app.controller('SubAccountsController', function ($routeParams, $scope, $location, AccountsService, SubAccountsService) {

    var id = $routeParams.id;

    listarSubAccounts(id);
    
    function listarSubAccounts(id) {
        AccountsService.getAccount(id).then(function (account) {
            $scope.account = account;
            $scope.subaccounts = account.subAccounts;
        });
    }    
    
    $scope.excluir = function (subaccount) {
        SubAccountsService.excluir(subaccount).then(redirecionarTabela());
    };
    
    function redirecionarTabela() {
        listarSubAccounts(id);
    };       
});

app.controller('TransactionsController', function ($routeParams, $scope, $location, SubAccountsService) {

    var id = $routeParams.id;

    if (id) {
        SubAccountsService.getAccount(id).then(function (subaccount) {
            $scope.account = subaccount.parentAccount;
            $scope.subaccount = subaccount;
            $scope.accountTransactions = subaccount.accountTransactions;
        });
    } else {
        listarSubAccounts();
    }
    
    
    function listarSubAccounts() {
        SubAccountsService.listar().then(function (subaccount) {
            $scope.accountTransactions = subaccount.accountTransactions;
        });
    }    
    
    $scope.excluir = function (subaccount) {
        SubAccountsService.excluir(subaccount).then(listarSubAccounts);
    };
       
});

app.controller('CadastroSubAccountsController', function ($routeParams, $scope, $location, AccountsService, SubAccountsService) {

    var id = $routeParams.id;
    var subid = $routeParams.subid;


    AccountsService.getAccount(id).then(function (account) {
        $scope.parentAccount = account;
    });
    
    if (subid) {
        SubAccountsService.getAccount(subid).then(function (subaccount) {
            $scope.subaccount = subaccount;
        });
    } else {
        $scope.subaccount = {parentAccount: $scope.account};
    }


    function salvar(id, subaccount) {
        $scope.subaccount = {parentAccount: $scope.parentAccount};
        return SubAccountsService.salvar(id, subaccount);
    };

    $scope.salvar = function (id, subaccount) {
        $scope.cadastroSubAccountsForm.$setPristine();
        salvar(id, subaccount).then(redirecionarTabela);
    };

    $scope.salvarCadastrarNovo = function (subaccount) {
        $scope.cadastroSubAccountsForm.$setPristine();
        salvar(subaccount);
    };

    function redirecionarTabela() {
        $location.path('/subaccounts/' + id);
    };

    $scope.cancelar = function () {
        $scope.subaccount = {};
        redirecionarTabela();
    };
});

app.controller('CadastroTransactionController', function ($routeParams, $scope, $location, SubAccountsService, TransactionsService) {

    var subid = $routeParams.subid;
    var transactionId = $routeParams.tid;


    SubAccountsService.getAccount(subid).then(function (subaccount) {
        $scope.account = subaccount.parentAccount;
        $scope.subaccount = subaccount;
    });
    
    if (transactionId) {
        TransactionsService.getTransaction(transactionId).then(function (transaction) {
            $scope.transaction = transaction;
        });
    } else {
        $scope.transaction = {account: $scope.subaccount};
    }


    function salvar(id, transaction) {
        $scope.subaccount = {account: $scope.subaccount};
        return TransactionsService.salvar(id, transaction);
    };

    $scope.salvar = function (id, transaction) {
        $scope.cadastroTransactionForm.$setPristine();
        salvar(id, transaction).then(redirecionarTabela);
    };

    $scope.salvarCadastrarNovo = function (transaction) {
        $scope.cadastroTransactionForm.$setPristine();
        salvar(transaction);
    };

    function redirecionarTabela() {
        $location.path('/accounttransactions/' + subid);
    }
    ;

    $scope.cancelar = function () {
        $scope.transaction = {};
        redirecionarTabela();
    };
});


app.controller('CadastroAccountsController', function ($routeParams, $scope, $location, AccountsService) {

    var id = $routeParams.id;

    if (id) {
        AccountsService.getAccount(id).then(function (account) {
            $scope.account = account;
        });
    } else {
        $scope.account = {};
    }


    function salvar(account) {
        $scope.account = {};
        return AccountsService.salvar(account);
    }
    ;

    $scope.salvar = function (account) {
        $scope.cadastroAccountsForm.$setPristine();
        salvar(account).then(redirecionarTabela);
    };

    $scope.salvarCadastrarNovo = function (account) {
        $scope.cadastroAccountsForm.$setPristine();
        salvar(account);
    };

    function redirecionarTabela() {
        $location.path('/accounts');
    }
    ;

    $scope.cancelar = function () {
        $scope.account = {};
        redirecionarTabela();
    };
});

app.service('AccountsService', function (AccountsResource) {

    this.getAccount = function (id) {
        return AccountsResource.getAccount({id: id}).$promise;
    };

    this.listar = function () {
        return AccountsResource.listar().$promise;
    };

    this.salvar = function (account) {
        if (account.id) {
            return AccountsResource.atualizar({id: account.id}, account).$promise;
        } else {
            return AccountsResource.salvar(account).$promise;
        }
    };

    this.excluir = function (account) {
        return AccountsResource.excluir({id: account.id}).$promise;
    };

});

app.service('SubAccountsService', function (SubAccountsResource) {

    this.getAccount = function (id) {
        return SubAccountsResource.getAccount({id: id}).$promise;
    };

    this.listar = function () {
        return SubAccountsResource.listar().$promise;
    };

    this.salvar = function (id, subAccount) {
        return SubAccountsResource.atualizar({id: id}, subAccount).$promise;
    };

    this.excluir = function (subAccount) {
        return SubAccountsResource.excluir({id: subAccount.id}).$promise;
    };

});

app.service('TransactionsService', function (TransactionsResource) {

    this.getTransaction = function (id) {
        return TransactionsResource.getTransaction({id: id}).$promise;
    };

    this.listar = function () {
        return TransactionsResource.listar().$promise;
    };

    this.salvar = function (id, transaction) {
        return TransactionsResource.atualizar({id: id}, transaction).$promise;
    };

    this.excluir = function (transaction) {
        return TransactionsResource.excluir({id: transaction.id}).$promise;
    };

});

app.factory('AccountsResource', function ($resource) {
    return $resource(baseUrl + '/lionapi/accounts/:id', {}, {
//    return $resource('http://localhost:8080/CRUD-back/api/accounts/:id', {}, {
//    return $resource('https://api-rest-accounts-tales.herokuapp.com/api/accounts/:id', {}, {
        atualizar: {
            method: 'PUT'
        },
        listar: {
            method: 'GET',
            isArray: true
        },
        getAccount: {
            method: 'GET'
        },
        salvar: {
            method: 'POST'
        },
        excluir: {
            method: 'DELETE'
        }

    });
});

app.factory('SubAccountsResource', function ($resource) {
    return $resource(baseUrl + '/lionapi/subaccounts/:id', {}, {
//    return $resource('http://localhost:8080/CRUD-back/api/accounts/:id', {}, {
//    return $resource('https://api-rest-accounts-tales.herokuapp.com/api/accounts/:id', {}, {
        atualizar: {
            method: 'PUT'
        },
        listar: {
            method: 'GET',
            isArray: true,
        },
        getAccount: {
            method: 'GET'
        },
        salvar: {
            method: 'POST'
        },
        excluir: {
            method: 'DELETE'
        }

    });
});

app.factory('TransactionsResource', function ($resource) {
    return $resource(baseUrl + '/lionapi/transactions/:id', {}, {
//    return $resource('http://localhost:8080/CRUD-back/api/accounts/:id', {}, {
//    return $resource('https://api-rest-accounts-tales.herokuapp.com/api/accounts/:id', {}, {
        atualizar: {
            method: 'PUT'
        },
        listar: {
            method: 'GET',
            isArray: true
        },
        getTransaction: {
            method: 'GET'
        },
        salvar: {
            method: 'POST'
        },
        excluir: {
            method: 'DELETE'
        }

    });
});

app.directive('dateFix', function() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attr, ngModel) {
            element.on('change', function() {
                scope.$apply(function () {
                    ngModel.$setViewValue(element.val());
                });         
            });
        }
    };
});