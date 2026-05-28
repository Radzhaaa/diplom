package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.Department;
import com.gamifiedpm.model.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findByOrganization(Organization organization);
    List<Department> findByOrganizationAndParentDepartmentIsNull(Organization organization);
    List<Department> findByParentDepartment(Department parentDepartment);
}
