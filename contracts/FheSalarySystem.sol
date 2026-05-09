// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "./SalaryToken.sol";

contract FheSalarySystem is ZamaEthereumConfig {
    // ========== 自定义错误定义 ==========

    error EmployeeExists();

    error EmployeeNotFound();

    error NotAdmin();

    error NotEmployee();

    error ContractPaused();

    error MismatchedArrays();

    // ========== 角色枚举定义 ==========
    enum UserRole {
        None,
        Employee,
        Admin
    }

    // ========== 明文权限与配置（公开非敏感） ==========

    address public immutable admin;

    bool public contractPaused;

    // ========== 员工结构（明文基础信息） ==========
    /**
     * @dev 员工信息结构，全部为明文数据
     */
    struct Employee {
        string name;
        string email;
        string homeAddress;
        bool isExist;
        bool hasNft;
        bool hasTierNft;
    }

    struct EmployeeWithAddress {
        address walletAddress;
        Employee employee;
    }

    mapping(address => euint64) private _encryptedSalaryBalance;

    mapping(address => Employee) public employees;
    address[] public employeeList;

    SalaryToken public salaryToken;

    // ========== 发放记录 ==========
    struct SalaryRecord {
        address employee;
        euint64 encryptedAmount;
        uint256 timestamp;
    }
    SalaryRecord[] public salaryRecords;

    // ========== 事件定义 ==========
  
    event EmployeeAdded(address indexed employee);
  
    event SalarySent(address indexed employee, uint256 indexed recordIndex);
  
    event SalaryWithdrawn(address indexed employee, uint64 amount);

    event TokensDeposited(address indexed admin, uint64 amount);

    // ========== 修饰器 ==========
   
    modifier onlyAdmin() {
        if (msg.sender != admin) {
            revert NotAdmin();
        }
        _;
    }

    modifier onlyEmployee() {
        if (!employees[msg.sender].isExist) {
            revert NotEmployee();
        }
        _;
    }

    modifier notPaused() {
        if (contractPaused) {
            revert ContractPaused();
        }
        _;
    }

    constructor(address _salaryToken) {
        admin = msg.sender;
        contractPaused = false;
        salaryToken = SalaryToken(_salaryToken);
    }

    // ========== 1. 管理员：添加员工（明文） ==========

    function addEmployee(
        address _wallet,
        string calldata _name,
        string calldata _email,
        string calldata _homeAddress
    ) external onlyAdmin notPaused {
        require(_wallet != address(0), "Invalid employee address");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_email).length > 0, "Email cannot be empty");
        if (employees[_wallet].isExist) {
            revert EmployeeExists();
        }
        employees[_wallet] = Employee({
            name: _name,
            email: _email,
            homeAddress: _homeAddress,
            isExist: true,
            hasNft: false,
            hasTierNft: false
        });
        employeeList.push(_wallet);
        emit EmployeeAdded(_wallet);
    }

    // ========== 2. 管理员：发放加密薪资（FHE 同态运算） ==========
    /**
     * @dev 向单个员工发放加密薪资（仅管理员）
     * 全程不解密任何数据
     */
    function sendEncryptedSalary(
        address _employee,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) public onlyAdmin notPaused {
        require(_employee != address(0), "Invalid employee address");
        if (!employees[_employee].isExist) {
            revert EmployeeNotFound();
        }

        euint64 encAmount = FHE.fromExternal(encryptedAmount, inputProof);

        _encryptedSalaryBalance[_employee] = FHE.add(
            _encryptedSalaryBalance[_employee],
            encAmount
        );

        FHE.allowThis(_encryptedSalaryBalance[_employee]);
        FHE.allow(_encryptedSalaryBalance[_employee], _employee);

        // 存储发薪记录，并授权管理员和员工访问该笔金额
        salaryRecords.push(SalaryRecord({
            employee: _employee,
            encryptedAmount: encAmount,
            timestamp: block.timestamp
        }));

        // 授权管理员和员工访问该笔发薪记录的金额
        FHE.allowThis(encAmount);
        FHE.allow(encAmount, admin);
        FHE.allow(encAmount, _employee);

        emit SalarySent(_employee, salaryRecords.length - 1);
    }

    // ========== 3. 管理员：批量发放加密薪资 ==========
    function batchSendEncryptedSalary(
        address[] calldata _employees,
        externalEuint64[] calldata encryptedAmounts,
        bytes[] calldata inputProofs
    ) external onlyAdmin notPaused {
        require(_employees.length > 0, "No employees provided");
        if (_employees.length != encryptedAmounts.length || 
            _employees.length != inputProofs.length) {
            revert MismatchedArrays();
        }

        for (uint256 i = 0; i < _employees.length; i++) {
            sendEncryptedSalary(_employees[i], encryptedAmounts[i], inputProofs[i]);
        }
    }

    // ========== 5. 获取加密薪资（密文形式） ==========
    function getEncryptedSalary() external view onlyEmployee returns (euint64) {
        return _encryptedSalaryBalance[msg.sender];
    }

    // ========== 7. 员工：提现薪资 ==========
    function withdrawSalary(
        uint64 amount
    ) external onlyEmployee notPaused {
        require(amount > 0, "Amount must be greater than 0");
        // 检查合约是否有足够的代币
        require(salaryToken.balanceOf(address(this)) >= amount, "Contract has insufficient tokens");

        euint64 balance = _encryptedSalaryBalance[msg.sender];
        // 直接运算，会检查余额是否足够 如果余额不足 会自动 revert
        _encryptedSalaryBalance[msg.sender] = FHE.sub(balance, amount);
        FHE.allowThis(_encryptedSalaryBalance[msg.sender]);
        FHE.allow(_encryptedSalaryBalance[msg.sender], msg.sender);

        salaryToken.transfer(msg.sender, amount);

        emit SalaryWithdrawn(msg.sender, amount);
    }

    // ========== 8. 发放记录查询 ==========
    /**
     * @dev 获取所有发放记录（仅管理员）
     * @return 所有发放记录数组
     */
    function getAllSalaryRecords() external view onlyAdmin returns (SalaryRecord[] memory) {
        return salaryRecords;
    }

    /**
     * @dev 获取当前员工的发放记录（仅员工）
     * @return 当前员工的发放记录数组
     */
    function getMySalaryRecords() external view onlyEmployee returns (SalaryRecord[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < salaryRecords.length; i++) {
            if (salaryRecords[i].employee == msg.sender) {
                count++;
            }
        }

        SalaryRecord[] memory myRecords = new SalaryRecord[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < salaryRecords.length; i++) {
            if (salaryRecords[i].employee == msg.sender) {
                myRecords[index] = salaryRecords[i];
                index++;
            }
        }
        return myRecords;
    }

    // ========== 工具函数（明文） ==========
    function pauseContract(bool _status) external onlyAdmin {
        contractPaused = _status;
    }

    function getEmployeeCount() external view returns (uint) {
        return employeeList.length;
    }

    function depositTokens(uint64 amount) external onlyAdmin {
        require(amount > 0, "Amount must be greater than 0");
        salaryToken.transferFrom(msg.sender, address(this), amount);
        emit TokensDeposited(msg.sender, amount);
    }

    function getContractBalance() external view returns (uint64) {
        return uint64(salaryToken.balanceOf(address(this)));
    }

    // ========== 9. 查询员工列表 ==========
    function getAllEmployees() external view onlyAdmin returns (EmployeeWithAddress[] memory) {
        EmployeeWithAddress[] memory allEmployees = new EmployeeWithAddress[](employeeList.length);
        for (uint256 i = 0; i < employeeList.length; i++) {
            allEmployees[i] = EmployeeWithAddress({
                walletAddress: employeeList[i],
                employee: employees[employeeList[i]]
            });
        }
        return allEmployees;
    }

    // ========== 10. 判断用户角色 ==========
    function getUserRole(address user) external view returns (UserRole) {
        if (user == admin) {
            return UserRole.Admin;
        }
        if (employees[user].isExist) {
            return UserRole.Employee;
        }
        return UserRole.None;
    }
}
