var app = angular.module('accountsApp', ['ngRoute', 'ngResource']);

//var baseUrl = "https://liongoldmining-investor.herokuapp.com/lionapi";
var baseUrl = "http://localhost:8080/lionapi";

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

    var accountId = $routeParams.id;

    listSubAccounts(accountId);
    
    function listSubAccounts(accountId) {
        console.log("listSubAccounts) accountId: " + accountId);
        AccountsService.getAccount(accountId).then(function (account) {
            console.log("listSubAccounts\AccountsService.getAccount) account: " + account.valueOf());
            $scope.account = account;
        });
        SubAccountsService.findAllByParentAccountId(accountId).then(function (subaccounts) {
            console.log("listSubAccounts\SubAccountsService.findAllByParentAccountId) subaccounts: " + subaccounts.valueOf());
            $scope.subaccounts = subaccounts;
        });
    };    
    
    $scope.excluir = function (subaccount) {
        var parentAccountId = $scope.account.id;
        SubAccountsService.excluir(subaccount).then(refreshSubAccountsTable(parentAccountId));
    };
    
    function refreshSubAccountsTable(parentAccountId) {
        console.log("listSubAccounts\refreshSubAccountsTable) parentAccountId: " + parentAccountId);
        listSubAccounts(parentAccountId);
    };
});

app.controller('TransactionsController', function ($routeParams, $scope, $location, AccountsService, SubAccountsService, TransactionsService) {

    var subaccountId = $routeParams.id;

    listTransactions(subaccountId);

    function listTransactions(subaccountId) {
        SubAccountsService.getAccount(subaccountId).then(function (subaccount) {
            $scope.subaccount = subaccount;
            AccountsService.getAccount($scope.subaccount.parentAccount).then(function (account) {
                $scope.account = account;
            });
        });
        TransactionsService.listar(subaccountId).then(function (accountTransactions) {
            $scope.accountTransactions = accountTransactions;
        });
    }; 
    
    $scope.excluir = function (transaction) {
        TransactionsService.excluir(transaction).then(refreshTransactionsTable($scope.subaccount.id));
    };

    function refreshTransactionsTable(subaccountId) {
        console.log("TransactionsController\refreshTransactionsTable) parentAccountId: " + subaccountId);
        listTransactions(subaccountId);
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

app.controller('CadastroTransactionController', function ($routeParams, $filter, $scope, $location, AccountsService, SubAccountsService, TransactionsService) {

    var subid = $routeParams.subid;
    var transactionId = $routeParams.tid;


    SubAccountsService.getAccount(subid).then(function (subaccount) {
        $scope.subaccount = subaccount;
        AccountsService.getAccount(AccountsService.parentAccount).then(function (account) {
                $scope.account = account;
        });        
    });
    
    if (transactionId) {
        TransactionsService.getTransaction(transactionId).then(function (transaction) {
            $scope.transaction = transaction;
        });
    } else {
        $scope.transaction = {account: $scope.subaccount, transactionDate: $filter("date")(Date.now(), 'yyyy-MM-dd')};
    }


    function salvar(id, transaction) {
        $scope.subaccount = {account: $scope.subaccount};
        return TransactionsService.salvar(id, transaction);
    };

    $scope.salvar = function (id, transaction) {
        delete transaction.account;
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
    };

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

    this.findAllByParentAccountId = function (id) {
        return SubAccountsResource.findAllByParentAccountId({id: id}).$promise;
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

    this.listar = function (id) {
        return TransactionsResource.listar({id: id}).$promise;
    };

    this.salvar = function (id, transaction) {
        return TransactionsResource.atualizar({id: id}, transaction).$promise;
    };

    this.excluir = function (transaction) {
        return TransactionsResource.excluir({id: transaction.id}).$promise;
    };

});

app.factory('AccountsResource', function ($resource) {
    return $resource(baseUrl + '/accounts/:id', {}, {
        atualizar: {
            method: 'PUT'
        },
        listar: {
            method: 'GET',
            isArray: true
        },
        getAccount: {
            method: 'GET',
            cache : false
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
    return $resource(baseUrl + '/subaccounts/:id/:subquery', {}, {
        atualizar: {
            method: 'PUT'
        },
        findAllByParentAccountId: {
            method: 'GET',
            isArray: true,
            params: {
                id: '@id',
                subquery: 'byaccountid'
            }
        },
        getAccount: {
            method: 'GET',
            cache : false
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
    return $resource(baseUrl + '/transactions/:id/:subquery', {}, {
        atualizar: {
            method: 'PUT'
        },
        listar: {
            method: 'GET',
            isArray: true,
            params: {
                id: '@id',
                subquery: 'bysubaccountid'
            }
        },
        getTransaction: {
            method: 'GET',
            cache : false
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
