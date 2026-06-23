PYTHON ?= python3
PLAYWRIGHT_BIN := node_modules/.bin/playwright

.PHONY: install demo-small demo-full benchmark-small benchmark-large download-olist demo-olist postgres-smoke mysql-smoke web-demo web-runner test

install:
	$(PYTHON) -m pip install -e ".[dev]"

demo-small:
	vsf-profiler demo create-olist-sample --out data/demo_olist
	vsf-profiler run \
		--dbml data/demo_olist/schema.dbml \
		--csv-dir data/demo_olist/csv \
		--out outputs/olist_demo

demo-full:
	vsf-profiler doctor
	$(MAKE) demo-small
	vsf-profiler package \
		--input outputs/olist_demo \
		--output outputs/olist_demo_package \
		--zip \
		--pdf \
		--force
	$(PYTHON) scripts/verify_vsf_artifacts.py \
		--run-dir outputs/olist_demo \
		--package-dir outputs/olist_demo_package \
		--zip-path outputs/olist_demo_package.zip
	@if command -v node >/dev/null 2>&1 && [ -x "$(PLAYWRIGHT_BIN)" ]; then \
		echo "Running Playwright dashboard E2E..."; \
		npm run test:e2e:dashboard; \
	else \
		echo "Skipping Playwright dashboard E2E: node or local Playwright is not present."; \
	fi
	@echo "Demo full outputs:"
	@echo "  Report HTML: outputs/olist_demo/report.html"
	@echo "  Report MD: outputs/olist_demo/report.md"
	@echo "  Package index: outputs/olist_demo_package/index.html"
	@echo "  Export manifest: outputs/olist_demo_package/export_manifest.json"
	@echo "  PDF report: outputs/olist_demo_package/analysis_report.pdf"
	@echo "  Package zip: outputs/olist_demo_package.zip"

benchmark-small:
	$(PYTHON) scripts/benchmark_large_dataset.py \
		--work-dir outputs/benchmark_ci \
		--rows 600 \
		--tables 7 \
		--force

benchmark-large:
	$(PYTHON) scripts/benchmark_large_dataset.py \
		--work-dir outputs/benchmark_large \
		--rows 50000 \
		--tables 8 \
		--force

download-olist:
	vsf-profiler demo download-olist --out data/olist

demo-olist:
	vsf-profiler demo run-olist \
		--csv-dir data/olist \
		--out outputs/olist_demo

postgres-smoke:
	$(PYTHON) -m pytest -q tests/test_postgres_acceptance.py

mysql-smoke:
	$(PYTHON) -m pytest -q tests/test_mysql_acceptance.py

web-demo:
	$(PYTHON) -m http.server 8080 --directory web

web-runner:
	vsf-profiler web --port 8765

test:
	pytest -q
