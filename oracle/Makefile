.PHONY: all
all: build

.PHONY: node_modules
.SILENT: node_modules
node_modules:
	npm install

.PHONY: build
.SILENT: build
build: node_modules
	dfx canister create bit10_oracle_backend
	dfx build

.PHONY: install
.SILENT: install
install: build
	dfx canister install bit10_oracle_backend --mode reinstall --yes

.PHONY: upgrade
.SILENT: upgrade
upgrade: build
	dfx canister install bit10_oracle_backend --mode=upgrade

.PHONY: test
.SILENT: test
test: install
	dfx canister call bit10_oracle_backend bit10_oracle_backend \
		| grep '\[1682978460,5\.714,5\.718,5\.714,5\.714,243\.5678\]' && echo 'PASS'

.PHONY: clean
.SILENT: clean
clean:
	rm -fr .dfx