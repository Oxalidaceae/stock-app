-- DART IFRS account_id가 VARCHAR(50)을 넘어가는 케이스가 다수.
-- 예: ifrs-full_ShareOfOtherComprehensiveIncomeOfAssociatesAndJointVenturesAccountedForUsingEquityMethod (97자)
-- account_name도 긴 한글 계정명에 대비해 같이 확장.

ALTER TABLE financial_statements
    ALTER COLUMN account_id   TYPE VARCHAR(200),
    ALTER COLUMN account_name TYPE VARCHAR(200);
