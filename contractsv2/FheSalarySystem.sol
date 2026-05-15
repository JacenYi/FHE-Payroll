// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, ebool, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "./SalaryToken.sol";

contract FheSalarySystem is ZamaEthereumConfig{
    error EmployeeExists();
    error EmployeeNotFound();
    error NotAdmin();
    error NotEmployee();
    error ContractPaused();
    error MismatchedArrays();
    error InsufficientContractBalance();
    error InsufficientEmployeeBalance();

    enum UserRole {
        None,
        Employee,
        Admin
    }

    address public immutable admin;
    bool public contractPaused;
    euint64 public contractEncryptedBalance;

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

    mapping(address => Employee) public employees;
    mapping(address => euint64) private _encryptedSalaryBalance;
    address[] public employeeList;
    SalaryToken public salaryToken;

    struct SalaryRecord {
        address employee;
        euint64 encryptedAmount;
        uint256 timestamp;
    }
    SalaryRecord[] public salaryRecords;

    event EmployeeAdded(address indexed employee);
    event SalarySent(address indexed employee, uint256 indexed recordIndex);
    event WithdrawalRequested(address indexed employee, bytes32 swapId);
    event DebugStep(uint256 step);

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

    function depositTokens(euint64 amount) public onlyAdmin {
       if (!FHE.isInitialized(contractEncryptedBalance)) {
            contractEncryptedBalance = amount;
        } else {
            contractEncryptedBalance = FHE.add(contractEncryptedBalance, amount);
        }
        FHE.allowThis(contractEncryptedBalance);
        FHE.allow(contractEncryptedBalance, admin);
        FHE.allow(amount,address(salaryToken));
        FHE.allowTransient(amount,address(salaryToken));
        salaryToken.confidentialTransferFrom(msg.sender, address(this), amount);
    }

    function depositTokensEncrypted(externalEuint64 encryptedAmount, bytes calldata inputProof) public onlyAdmin {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
         if (!FHE.isInitialized(contractEncryptedBalance)) {
            contractEncryptedBalance = amount;
        } else {
            contractEncryptedBalance = FHE.add(contractEncryptedBalance, amount);
        }
        FHE.allowThis(contractEncryptedBalance);
        FHE.allow(contractEncryptedBalance, admin);
        FHE.allow(amount,address(salaryToken));
        FHE.allowTransient(amount,address(salaryToken));
        salaryToken.confidentialTransferFrom(msg.sender, address(this), amount);
    }

    function authorizeContract() external onlyAdmin {
        // 让工资合约自己授权自己！
        salaryToken.setOperator(address(this), type(uint48).max);
    }
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
        if (!FHE.isInitialized(_encryptedSalaryBalance[_employee])) {
            _encryptedSalaryBalance[_employee] = encAmount;
        } else {
            _encryptedSalaryBalance[_employee] = FHE.add(
                _encryptedSalaryBalance[_employee],
                encAmount
            );
        }
        FHE.allowThis(_encryptedSalaryBalance[_employee]);
        FHE.allow(_encryptedSalaryBalance[_employee], _employee);
        contractEncryptedBalance = FHE.sub(contractEncryptedBalance, encAmount);
        FHE.allow(contractEncryptedBalance, admin);
        FHE.allowThis(encAmount);
        FHE.allow(encAmount, admin);
        FHE.allow(encAmount, _employee);
        FHE.allow(encAmount, address(salaryToken));
        FHE.allowTransient(encAmount,address(salaryToken));
        salaryToken.confidentialTransferFrom(address(this), _employee, encAmount);

        salaryRecords.push(SalaryRecord({ 
            employee: _employee,
            encryptedAmount: encAmount,
            timestamp: block.timestamp
        }));
      
       
        emit SalarySent(_employee, salaryRecords.length - 1);
    }
    function batchSendEncryptedSalary(
        address[] calldata _employees,
        externalEuint64[] calldata encryptedAmounts,
        bytes[] calldata inputProofs
    ) external onlyAdmin notPaused {
        require(_employees.length > 0, "No employees provided");
        if (_employees.length != encryptedAmounts.length || _employees.length != inputProofs.length) {
            revert MismatchedArrays();
        }
        for (uint256 i = 0; i < _employees.length; i++) {
            emit DebugStep(103);
            sendEncryptedSalary(_employees[i], encryptedAmounts[i], inputProofs[i]);
        }
    }
    function withdraw(externalEuint64 encryptedAmount, bytes calldata inputProof) external onlyEmployee {
        euint64 withdrawAmount = FHE.fromExternal(encryptedAmount, inputProof);
        euint64 currentBalance = _encryptedSalaryBalance[msg.sender];
        if (!FHE.isInitialized(currentBalance)) {
            revert InsufficientEmployeeBalance();
        }

        _encryptedSalaryBalance[msg.sender] = FHE.sub(currentBalance, withdrawAmount);
        FHE.allowThis(_encryptedSalaryBalance[msg.sender]);
        FHE.allow(_encryptedSalaryBalance[msg.sender], msg.sender);

        emit WithdrawalRequested(msg.sender, bytes32(0));
    }

    function getEncryptedBalance() external view onlyEmployee returns (euint64) {
        return _encryptedSalaryBalance[msg.sender];
    }

    function getAllSalaryRecords() external view onlyAdmin returns (SalaryRecord[] memory) {
        return salaryRecords;
    }

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

    function pauseContract(bool _status) external onlyAdmin {
        contractPaused = _status;
    }

    function getEmployeeCount() external view returns (uint256) {
        return employeeList.length;
    }

    function getContractEncryptedBalance() external view returns (euint64) { 
        return contractEncryptedBalance;
    }

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
